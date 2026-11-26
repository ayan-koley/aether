// Define command input and execution result types.

export type AllowedCommand = "npm" | "node";

export interface ExecuteCommandInput {
  command: AllowedCommand;
  args: string[];
  timeoutMs?: number;
  signal?: AbortSignal;
  cwd?: string;
}

export type CommandStatus =
  | "success"
  | "failed"
  | "timed_out"
  | "cancelled";

export interface CommandExecutionResult {
  command: string;
  args: string[];
  status: CommandStatus;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  outputTruncated: boolean;
}
