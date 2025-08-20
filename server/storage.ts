import { type ThumbnailRequest, type InsertThumbnailRequest, type DailyUsage, type InsertDailyUsage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getThumbnailRequest(id: string): Promise<ThumbnailRequest | undefined>;
  createThumbnailRequest(request: InsertThumbnailRequest & {
    selectedModel: string;
    modelReasoning?: string;
    generatedImages?: any[];
    generationTime?: number;
    qualityScore?: number;
  }): Promise<ThumbnailRequest>;
  getDailyUsage(ipAddress: string, date: string): Promise<DailyUsage | undefined>;
  createOrUpdateDailyUsage(usage: InsertDailyUsage): Promise<DailyUsage>;
  incrementDailyUsage(ipAddress: string, date: string): Promise<DailyUsage>;
}

export class MemStorage implements IStorage {
  private thumbnailRequests: Map<string, ThumbnailRequest>;
  private dailyUsage: Map<string, DailyUsage>;

  constructor() {
    this.thumbnailRequests = new Map();
    this.dailyUsage = new Map();
  }

  async getThumbnailRequest(id: string): Promise<ThumbnailRequest | undefined> {
    return this.thumbnailRequests.get(id);
  }

  async createThumbnailRequest(request: InsertThumbnailRequest & {
    selectedModel: string;
    modelReasoning?: string;
    generatedImages?: any[];
    generationTime?: number;
    qualityScore?: number;
  }): Promise<ThumbnailRequest> {
    const id = randomUUID();
    const thumbnailRequest: ThumbnailRequest = {
      id,
      prompt: request.prompt,
      style: request.style,
      aspectRatio: request.aspectRatio,
      selectedModel: request.selectedModel,
      modelReasoning: request.modelReasoning || null,
      generatedImages: request.generatedImages || [],
      generationTime: request.generationTime || null,
      qualityScore: request.qualityScore || null,
      createdAt: new Date(),
    };
    this.thumbnailRequests.set(id, thumbnailRequest);
    return thumbnailRequest;
  }

  async getDailyUsage(ipAddress: string, date: string): Promise<DailyUsage | undefined> {
    const key = `${ipAddress}-${date}`;
    return this.dailyUsage.get(key);
  }

  async createOrUpdateDailyUsage(usage: InsertDailyUsage): Promise<DailyUsage> {
    const key = `${usage.ipAddress}-${usage.date}`;
    const existing = this.dailyUsage.get(key);
    
    if (existing) {
      existing.generationCount = usage.generationCount || 0;
      return existing;
    }

    const id = randomUUID();
    const newUsage: DailyUsage = {
      id,
      ipAddress: usage.ipAddress,
      date: usage.date,
      generationCount: usage.generationCount || 0,
      createdAt: new Date(),
    };
    this.dailyUsage.set(key, newUsage);
    return newUsage;
  }

  async incrementDailyUsage(ipAddress: string, date: string): Promise<DailyUsage> {
    const existing = await this.getDailyUsage(ipAddress, date);
    
    if (existing) {
      existing.generationCount = (existing.generationCount || 0) + 1;
      return existing;
    }

    return this.createOrUpdateDailyUsage({
      ipAddress,
      date,
      generationCount: 1,
    });
  }
}

export const storage = new MemStorage();
