import { getRabbit, publish } from "../rabbit.js";
import { CFG } from "../config.js";
import pino from "pino";
import { z } from "zod";
import fs from "node:fs";
import { parse } from "csv-parse";

const log = pino({ name: "validateWorker" });

// Validate
const CONSTANTS = {
  PREFETCH_COUNT: 10,
  MAX_ITEM_NAME_LENGTH: 100,
  MAX_PRICE: 100000000,
};
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const priceRegex = /^(?:\d+)(?:\.\d{1,2})?$/;
const phoneRegex = /^[0-9]{10,11}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}/; // YYYY-MM-DD

const Quantity = z
  .union([
    z.number().int(),
    z
      .string()
      .regex(/^\d+$/)
      .transform((v) => parseInt(v, 10)),
  ])
  .refine((v) => v > 0, { message: "Số lượng phải là số nguyên dương" });

const Price = z
  .union([
    z.number(),
    z
      .string()
      .regex(priceRegex, { message: "Định dạng giá không hợp lệ" })
      .transform((v) => parseFloat(v)),
  ])
  .refine((v) => v > 0 && v <= CONSTANTS.MAX_PRICE, {
    message: `Giá phải từ 0 đến ${CONSTANTS.MAX_PRICE}`,
  });

const Phone = z
  .preprocess(
    (v) => (v === "" || v === null ? null : String(v).trim()),
    z
      .string()
      .regex(phoneRegex, {
        message: "Số điện thoại phải có 10-11 chữ số",
      })
      .optional()
      .nullable()
  )
  .optional()
  .nullable();

const Email = z
  .preprocess(
    (v) => (v === "" || v === null ? null : v),
    z
      .string()
      .regex(emailRegex, {
        message: "Email không hợp lệ",
      })
      .optional()
      .nullable()
  )
  .optional()
  .nullable();

const OrderDate = z.union([
  z.string().regex(dateRegex, {
    message: "Định dạng ngày không hợp lệ (YYYY-MM-DD)",
  }),
  z.date(),
]);

const ItemName = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z
    .string()
    .min(1, { message: "Tên sản phẩm không được để trống" })
    .max(CONSTANTS.MAX_ITEM_NAME_LENGTH, {
      message: `Tên sản phẩm không được quá ${CONSTANTS.MAX_ITEM_NAME_LENGTH} ký tự`,
    })
    .regex(/^[\p{L}\p{N}\s\-,.()]+$/u, {
      message: "Tên sản phẩm chứa ký tự không hợp lệ",
    })
    .optional()
    .nullable()
);

const RowSchema = z.object({
  type: z.literal("row"),
  order_id: z.string().min(1, { message: "Mã đơn hàng không được để trống" }),
  store_code: z.string().min(1, { message: "Mã cửa hàng không được để trống" }),
  customer_phone: Phone,
  customer_email: Email,
  order_date: OrderDate,
  item_sku: z.string().min(1, { message: "Mã SKU không được để trống" }),
  item_name: ItemName,
  qty: Quantity,
  unit_price: Price,
  currency: z.string().default("VND"),
  source_tag: z.string().default("csv"),
});

const { conn, ch } = await getRabbit();
await ch.prefetch(10);

ch.consume(
  CFG.QUEUES.VALIDATE,
  async (msg) => {
    if (!msg) return;

    let body;
    try {
      body = JSON.parse(msg.content.toString());
    } catch (err) {
      log.error({ err }, "Lỗi parse message JSON");
      ch.nack(msg, false, false);
      return;
    }

    // Xử lý file CSV
    if (body.type === "csv_file") {
      let rowCount = 0;
      let successCount = 0;

      try {
        // Kiểm tra file tồn tại
        if (!fs.existsSync(body.path)) {
          throw new Error(`File không tồn tại: ${body.path}`);
        }

        const fileStream = fs.createReadStream(body.path);
        const parser = parse({
          columns: true,
          trim: true,
          skip_empty_lines: true,
        });

        // Xử lý lỗi stream
        fileStream.on("error", (err) => {
          log.error({ err, path: body.path }, "Lỗi đọc file");
          throw err;
        });

        fileStream.pipe(parser);

        for await (const rec of parser) {
          rowCount++;
          try {
            const payload = {
              type: "row",
              order_id: String(rec.order_id ?? rec.orderId ?? "").trim(),
              store_code: String(rec.store_code ?? rec.store ?? "").trim(),
              customer_phone: rec.customer_phone ?? rec.phone ?? null,
              customer_email: rec.customer_email ?? rec.email ?? null,
              order_date: rec.order_date ?? rec.date,
              item_sku: String(rec.item_sku ?? rec.sku ?? "").trim(),
              item_name: rec.item_name ?? rec.name ?? null,
              qty: rec.qty,
              unit_price: rec.unit_price ?? rec.price,
              currency: rec.currency ?? "VND",
              source_tag: body.source_tag ?? "csv",
            };

            const parsed = RowSchema.parse(payload);
            await publish(ch, CFG.ROUTING.TRANSFORM, parsed);
            successCount++;
          } catch (err) {
            log.warn(
              { row: rowCount, order_id: rec.order_id, err: err.message },
              "Lỗi validate dòng"
            );
          }
        }

        ch.ack(msg);
        log.info(
          {
            path: body.path,
            total: rowCount,
            success: successCount,
            failed: rowCount - successCount,
          },
          "Xử lý file hoàn tất"
        );
      } catch (err) {
        log.error({ err, path: body.path }, "Lỗi xử lý file CSV");
        ch.nack(msg, false, false);
      }
      return;
    }

    // Xử lý single row
    if (body.type === "row") {
      try {
        const parsed = RowSchema.parse(body);
        await publish(ch, CFG.ROUTING.TRANSFORM, parsed);
        ch.ack(msg);
        log.debug({ order_id: body.order_id }, "Validate row thành công");
      } catch (err) {
        log.error({ err, order_id: body.order_id }, "Lỗi validate row");
        ch.nack(msg, false, false);
      }
      return;
    }

    // Loại message không xác định
    log.error({ type: body.type }, "Loại message không xác định");
    ch.nack(msg, false, false);
  },
  { noAck: false }
);

log.info({ prefetch: CONSTANTS.PREFETCH_COUNT }, "validateWorker đã khởi động");
//console.log('[validate] file/row OK → transform:', (body.type==='row'?body.order_id:body.path));
