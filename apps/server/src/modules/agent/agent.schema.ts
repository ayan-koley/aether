import { z } from "zod";
import { AGENT_CONFIG } from "./agent.constants.js";

const relativeFilePathSchema = z
  .string()
  .min(1)
  .max(200)
  .refine(
    (value) =>
      !value.startsWith("/") &&
      !value.includes("\\") &&
      !value.includes("\0") &&
      !/^[a-zA-Z]:/.test(value) &&
      !value.split("/").includes("..") &&
      !value.split("/").includes("."),
    "File path must be a safe relative path",
  );

const writeFileOperationSchema = z.object({
  type: z.literal("write_file"),
  path: relativeFilePathSchema,
  content: z
    .string()
    .max(AGENT_CONFIG.maxFileContentLength),
}).strict();

const deleteFileOperationSchema = z.object({
  type: z.literal("delete_file"),
  path: relativeFilePathSchema,
}).strict();

export const fileOperationSchema = z.discriminatedUnion("type", [
  writeFileOperationSchema,
  deleteFileOperationSchema,
]);

export const agentPlanSchema = z.object({
  schemaVersion: z.literal(AGENT_CONFIG.schemaVersion),

  summary: z.string().min(1).max(1_000),

  operations: z
    .array(fileOperationSchema)
    .min(1)
    .max(AGENT_CONFIG.maxOperations),
}).strict().superRefine((plan, ctx) => {
  const paths = new Set<string>();

  plan.operations.forEach((operation, index) => {
    if (paths.has(operation.path)) {
      ctx.addIssue({
        code: "custom",
        path: ["operations", index, "path"],
        message: "Duplicate file operation path",
      });
    }

    paths.add(operation.path);
  });
});

export type AgentPlan = z.infer<typeof agentPlanSchema>;
export type FileOperation = z.infer<typeof fileOperationSchema>;