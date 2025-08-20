import { type AIModelSelection } from "@shared/schema";

export class AIModelSelector {
  async selectBestModel(prompt: string, style: string, aspectRatio: string): Promise<AIModelSelection> {
    // Use intelligent rule-based selection instead of paid AI
    return this.selectModelByRules(prompt, style, aspectRatio);
  }

  private selectModelByRules(prompt: string, style: string, aspectRatio: string): AIModelSelection {
    const lowerPrompt = prompt.toLowerCase();
    const lowerStyle = style.toLowerCase();
    
    let selectedModel: "stable-diffusion" | "flux" | "sdxl";
    let reasoning: string;
    let confidence: number;

    // Check for artistic/creative content
    if (lowerStyle.includes("artistic") || 
        lowerPrompt.includes("art") || 
        lowerPrompt.includes("creative") ||
        lowerPrompt.includes("abstract") ||
        lowerPrompt.includes("painting") ||
        lowerPrompt.includes("illustration")) {
      selectedModel = "flux";
      reasoning = "Selected Flux for its excellent artistic and creative capabilities";
      confidence = 0.9;
    }
    // Check for photorealistic content
    else if (lowerStyle.includes("photorealistic") || 
             lowerPrompt.includes("photo") || 
             lowerPrompt.includes("realistic") ||
             lowerPrompt.includes("portrait") ||
             lowerPrompt.includes("landscape")) {
      selectedModel = "sdxl";
      reasoning = "Selected SDXL for high-quality photorealistic results";
      confidence = 0.85;
    }
    // Check for technical/typography content
    else if (lowerStyle.includes("typography") || 
             lowerPrompt.includes("text") || 
             lowerPrompt.includes("logo") ||
             lowerPrompt.includes("tech") ||
             lowerPrompt.includes("geometric")) {
      selectedModel = "stable-diffusion";
      reasoning = "Selected Stable Diffusion for technical and text-focused content";
      confidence = 0.8;
    }
    // Default to Stable Diffusion as most reliable
    else {
      selectedModel = "stable-diffusion";
      reasoning = "Selected Stable Diffusion as the most reliable option for general content";
      confidence = 0.75;
    }

    return {
      selectedModel,
      reasoning,
      confidence,
    };
  }

  private getFallbackSelection(style: string, prompt: string): AIModelSelection {
    let selectedModel: "stable-diffusion" | "flux" | "sdxl";
    let reasoning: string;

    const lowerPrompt = prompt.toLowerCase();
    const lowerStyle = style.toLowerCase();

    if (lowerStyle.includes("photorealistic") || lowerPrompt.includes("photo") || lowerPrompt.includes("real")) {
      selectedModel = "sdxl";
      reasoning = "Selected SDXL for high-quality photorealistic content";
    } else if (lowerStyle.includes("artistic") || lowerPrompt.includes("art") || lowerPrompt.includes("creative")) {
      selectedModel = "flux";
      reasoning = "Selected Flux for artistic and creative content";
    } else {
      selectedModel = "stable-diffusion";
      reasoning = "Selected Stable Diffusion as reliable free option";
    }

    return {
      selectedModel,
      reasoning,
      confidence: 0.8,
    };
  }
}
