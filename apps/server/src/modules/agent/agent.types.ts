import type { AgentPlan } from "./agent.schema.js";

export interface ProjectContextFile {
  path: string;
  content: string;
}

export interface AgentRequest {
  prompt: string;
  projectContext?: ProjectContextFile[];
  conversationContext?: string;
}

export interface GeneratePlanResult {
  plan: AgentPlan;
  model: string;
}