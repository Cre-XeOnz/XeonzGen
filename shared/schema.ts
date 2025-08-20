import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const thumbnailRequests = pgTable("thumbnail_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prompt: text("prompt").notNull(),
  style: varchar("style", { length: 50 }).notNull(),
  aspectRatio: varchar("aspect_ratio", { length: 20 }).notNull(),
  selectedModel: varchar("selected_model", { length: 50 }).notNull(),
  modelReasoning: text("model_reasoning"),
  generatedImages: jsonb("generated_images").default([]),
  generationTime: integer("generation_time"), // in seconds
  qualityScore: integer("quality_score"), // 1-10 rating
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyUsage = pgTable("daily_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  generationCount: integer("generation_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertThumbnailRequestSchema = createInsertSchema(thumbnailRequests).pick({
  prompt: true,
  style: true,
  aspectRatio: true,
}).extend({
  imageCount: z.number().min(1).max(20).optional().default(5),
});

export const insertDailyUsageSchema = createInsertSchema(dailyUsage).pick({
  ipAddress: true,
  date: true,
  generationCount: true,
});

export type InsertThumbnailRequest = z.infer<typeof insertThumbnailRequestSchema>;
export type ThumbnailRequest = typeof thumbnailRequests.$inferSelect;
export type InsertDailyUsage = z.infer<typeof insertDailyUsageSchema>;
export type DailyUsage = typeof dailyUsage.$inferSelect;

// API Response types
export const aiModelSelectionSchema = z.object({
  selectedModel: z.enum(["stable-diffusion", "flux", "sdxl"]),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
});

export const thumbnailGenerationSchema = z.object({
  images: z.array(z.object({
    url: z.string(),
    qualityScore: z.number().min(1).max(10),
    model: z.string(),
  })),
  generationTime: z.number(),
  selectedModel: z.string(),
  reasoning: z.string(),
});

export type AIModelSelection = z.infer<typeof aiModelSelectionSchema>;
export type ThumbnailGeneration = z.infer<typeof thumbnailGenerationSchema>;
