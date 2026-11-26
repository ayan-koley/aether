// Define timeout, output-size and concurrency limits.
export const COMMAND_EXECUTOR_CONFIG = {
  defaultTimeoutMs: 120_000,
  maxTimeoutMs: 120_000,

  maxOutputBytes: 1024 * 1024,

  maxConcurrentCommands: 2,

  allowedCommands: ["npm", "node"] as const,

  allowedNpmScripts: [
    "build",
    "dev",
    "typecheck",
  ] as const,
} as const;
