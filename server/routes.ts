import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertThumbnailRequestSchema } from "@shared/schema";
import { AIModelSelector } from "./services/ai-selector";
import { ImageGenerator } from "./services/image-generator";


export async function registerRoutes(app: Express): Promise<Server> {
  const aiSelector = new AIModelSelector();
  const imageGenerator = new ImageGenerator();


  // Get daily usage for rate limiting
  app.get("/api/usage/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
      
      const usage = await storage.getDailyUsage(ipAddress, date);
      const generationsLeft = 999; // Unlimited generations
      
      res.json({ generationsLeft, generationCount: usage?.generationCount || 0 });
    } catch (error) {
      res.status(500).json({ message: "Failed to get usage data" });
    }
  });

  // Analyze prompt and select AI model
  app.post("/api/analyze-prompt", async (req, res) => {
    try {
      const { prompt, style, aspectRatio } = req.body;
      
      if (!prompt || !style || !aspectRatio) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const selection = await aiSelector.selectBestModel(prompt, style, aspectRatio);
      res.json(selection);
    } catch (error) {
      console.error("Error analyzing prompt:", error);
      res.status(500).json({ message: "Failed to analyze prompt" });
    }
  });

  // Generate thumbnail
  app.post("/api/generate-thumbnail", async (req, res) => {
    try {
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      const validationResult = insertThumbnailRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.error("Validation errors:", validationResult.error.errors);
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: validationResult.error.errors
        });
      }

      const { prompt, style, aspectRatio, imageCount = 5 } = validationResult.data;
      const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
      const today = new Date().toISOString().split('T')[0];

      // Unlimited generations - no rate limiting
      const usage = await storage.getDailyUsage(ipAddress, today);

      // Select AI model
      const selection = await aiSelector.selectBestModel(prompt, style, aspectRatio);
      
      // Generate images
      const result = await imageGenerator.generateImages(
        prompt, 
        style, 
        aspectRatio, 
        selection.selectedModel, 
        selection.reasoning,
        imageCount
      );

      // Save request to storage
      const thumbnailRequest = await storage.createThumbnailRequest({
        prompt,
        style,
        aspectRatio,
        imageCount,
        selectedModel: selection.selectedModel,
        modelReasoning: selection.reasoning,
        generatedImages: result.images,
        generationTime: result.generationTime,
        qualityScore: Math.round(result.images.reduce((sum, img) => sum + img.qualityScore, 0) / result.images.length),
      });

      // Increment usage counter
      await storage.incrementDailyUsage(ipAddress, today);

      res.json({
        id: thumbnailRequest.id,
        ...result,
      });
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to generate thumbnail" });
    }
  });

  // Get thumbnail request by ID
  app.get("/api/thumbnail/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const request = await storage.getThumbnailRequest(id);
      
      if (!request) {
        return res.status(404).json({ message: "Thumbnail request not found" });
      }

      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Failed to get thumbnail request" });
    }
  });



  // Create image variation
  app.post("/api/create-variation", async (req, res) => {
    try {
      const { imageUrl, variationType = 'style', prompt = 'high quality image' } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ message: "Image URL is required" });
      }

      // Create a simple variation by returning the original URL with mock data
      const result = {
        originalUrl: imageUrl,
        variationUrl: imageUrl, // Using original URL as placeholder
        variationType: variationType,
        model: "pollinations-variation",
        processingTime: 0.5,
        id: `variation-${Date.now()}`
      };
      
      res.json(result);
    } catch (error) {
      console.error("Error creating variation:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create variation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
