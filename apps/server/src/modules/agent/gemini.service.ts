import 'dotenv/config';
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, Output } from "ai";

import { AGENT_CONFIG } from "./agent.constants.js";
import { agentPlanSchema } from "./agent.schema.js";
import type { AgentPlan } from "./agent.schema.js";

export class GeminiService {
  private readonly google;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    this.google = createGoogleGenerativeAI({ apiKey });
  }

  async generatePlan(prompt: string): Promise<AgentPlan> {
    const model =
      process.env.GEMINI_MODEL ?? AGENT_CONFIG.defaultModel;

    const result = await generateText({
      model: this.google(model),

      output: Output.object({
        schema: agentPlanSchema,
        name: "aether_implementation_plan",
        description: "A safe file-operation plan for a React project",
      }),

      system: prompt,

      prompt: "Generate the implementation plan for the user's request.",

      maxOutputTokens: AGENT_CONFIG.maxOutputTokens,
    });

    if (!result.output) {
      throw new Error("Gemini did not generate a valid plan");
    }

    return result.output;
  }
}