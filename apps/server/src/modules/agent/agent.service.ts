import { AGENT_CONFIG } from "./agent.constants.js";
import { GeminiService } from "./gemini.service.js";
import { PromptBuilderService } from "./prompt-builder.service.js";
import { PlanValidatorService } from "./plan-validator.service.js";

import type {
  AgentRequest,
  GeneratePlanResult,
} from "./agent.types.js";

export class AgentService {
  constructor(
    private readonly geminiService = new GeminiService(),
    private readonly promptBuilder = new PromptBuilderService(),
    private readonly planValidator = new PlanValidatorService(),
  ) {}

  async generatePlan(
    request: AgentRequest,
  ): Promise<GeneratePlanResult> {
    // 1. Build the prompt
    const prompt = this.promptBuilder.build(request);

    // 2. Ask Gemini to generate a structured plan
    const generatedPlan = await this.geminiService.generatePlan(prompt);

    // 3. Validate the generated plan again on the backend
    const validatedPlan = this.planValidator.validate(generatedPlan);

    // 4. Return the validated plan
    return {
      plan: validatedPlan,
      model: process.env.GEMINI_MODEL ?? AGENT_CONFIG.defaultModel,
    };
  }
}