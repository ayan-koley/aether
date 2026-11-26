import path from "node:path";

import { agentPlanSchema } from "./agent.schema.js";
import type { AgentPlan } from "./agent.schema.js";

const BLOCKED_SEGMENTS = new Set([
  ".git",
  "node_modules",
  ".vercel",
  "dist",
  "coverage",
]);

export class PlanValidatorService {
  validate(input: unknown): AgentPlan {
    const result = agentPlanSchema.safeParse(input);

    if (!result.success) {
      throw new Error(
        `Invalid agent plan: ${result.error.message}`,
      );
    }

    const plan = result.data;

    for (const operation of plan.operations) {
      this.validatePath(operation.path);
    }

    return plan;
  }

  private validatePath(requestedPath: string): void {
    const normalizedPath = path.posix.normalize(requestedPath);

    if (
      normalizedPath === "." ||
      normalizedPath.startsWith("../") ||
      path.posix.isAbsolute(normalizedPath)
    ) {
      throw new Error("Unsafe file path");
    }

    const segments = normalizedPath.split("/");

    if (
      segments.some((segment) =>
        BLOCKED_SEGMENTS.has(segment.toLowerCase()),
      )
    ) {
      throw new Error("Operation targets a blocked directory");
    }

    const filename = segments.at(-1)?.toLowerCase() ?? "";

    if (
      filename === ".env" ||
      filename.startsWith(".env.") ||
      filename.endsWith(".pem") ||
      filename.endsWith(".key")
    ) {
      throw new Error("Operation targets a protected file");
    }
  }
}