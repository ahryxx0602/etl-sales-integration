import { getRabbit, publish } from "../rabbit.js";
import { CFG } from "../config.js";
import pino from "pino";
import { z } from "zod";
import fs from "node:fs";
import { parse } from "csv-parse";

const log = pino({ name: "validateWorker" });

// Validate
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const priceRegex = /^(?:\d+)(?:\.\d{1,2})?$/;

const Quantity = z
  .union([
    z.number().int(),
    z
      .string()
      .regex(/^\d+$/)
      .transform((v) => parseInt(v, 10)),
  ])
  .transform((v) => Number(v))
  .refine((v) => Number.isInteger(v) && v > 0, {
    message: "Số lượng phải là số nguyên dương",
  });

const Price = z
  .union([
    z.number(),
    z
      .string()
      .regex(priceRegex, { message: "định dạng giá không hợp lệ" })
      .transform((v) => parseFloat(v)),
  ])
  .transform((v) => Number(v))
  .refine((v) => v > 0, { message: "giá đơn vị phải > 0" });

const RowSchema = z.object({
  type: z.literal("row"),
  order_id: z.string().min(1),
  store_code: z.string().min(1),
  customer_phone: z.string().optional().nullable(),
  customer_email: z
    .preprocess(
      (v) => (v === "" ? null : v),
      z.string().regex(emailRegex).optional().nullable()
    )
    .optional()
    .nullable(),
  order_date: z.union([z.string(), z.date()]),
  item_sku: z.string().min(1),
  item_name: z.string().optional().nullable(),
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
    try {
      const body = JSON.parse(msg.content.toString());

      if (body.type === "csv_file") {
        // stream file, push từng dòng dạng 'row'
        const parser = fs
          .createReadStream(body.path)
          .pipe(parse({ columns: true, trim: true }));

        for await (const rec of parser) {
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
          // validate nhanh; nếu lỗi, ném sang DLQ
          const parsed = RowSchema.parse(payload);
          await publish(ch, CFG.ROUTING.TRANSFORM, parsed);
        }

        ch.ack(msg);
        console.log("[validate] file OK → transform:", body.path);
        return;
      }

      if (body.type === "row") {
        const parsed = RowSchema.parse(body);
        await publish(ch, CFG.ROUTING.TRANSFORM, parsed);
        ch.ack(msg);
        console.log("[validate] row OK → transform:", body.order_id);
        return;
      }

      throw new Error("loại tin nhắn không xác định");
    } catch (e) {
      log.error(e, "xác thực không thành công");
      ch.nack(msg, false, false); // gửi sang DLQ
    }
  },
  { noAck: false }
);

log.info("validateWorker started");
//console.log('[validate] file/row OK → transform:', (body.type==='row'?body.order_id:body.path));
