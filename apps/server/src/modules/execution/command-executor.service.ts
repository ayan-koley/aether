/**
 * Validate commands.
 * Apply execution limits.
 * Execute commands through SandboxService.
 * Capture stdout and stderr.
 * Return structured execution results.
 */


import { Writable } from "node:stream";

import type { SandboxInstance } from "../sandbox/sandbox.types.js";
import { SandboxService } from "../sandbox/sandbox.service.js";

import { COMMAND_EXECUTOR_CONFIG } from "./command-executor.constants.js";

import type {
  ExecuteCommandInput,
  CommandExecutionResult,
  AllowedCommand,
  CommandStatus,
} from "./command-executor.types.js";

// Captures output without storing more than the configured limit.
class OutputCapture extends Writable {
  private chunks: Buffer[] = [];
  private bytesCaptured = 0;
  truncated = false;

  constructor(private readonly maxBytes: number) {
    super();
  }

  override _write(
    chunk: Buffer | string,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    const buffer = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk, encoding);

    const remaining = this.maxBytes - this.bytesCaptured;

    if (remaining > 0) {
      const captured = buffer.subarray(0, remaining);

      this.chunks.push(captured);
      this.bytesCaptured += captured.length;
    }

    if (buffer.length > remaining) {
      this.truncated = true;
    }

    callback();
  }

  getOutput(): string {
    return Buffer.concat(this.chunks).toString("utf-8");
  }
}

export class CommandExecutorService {
  private activeCommands = 0;

  constructor(
    private readonly sandboxService: SandboxService,
  ) {}

  async execute(
    sandbox: SandboxInstance,
    input: ExecuteCommandInput,
  ): Promise<CommandExecutionResult> {
    this.validateCommand(input.command, input.args);

    const timeoutMs =
      input.timeoutMs ??
      COMMAND_EXECUTOR_CONFIG.defaultTimeoutMs;

    if (
      !Number.isInteger(timeoutMs) ||
      timeoutMs <= 0 ||
      timeoutMs > COMMAND_EXECUTOR_CONFIG.maxTimeoutMs
    ) {
      throw new Error("Invalid command timeout.");
    }

    if (
      this.activeCommands >=
      COMMAND_EXECUTOR_CONFIG.maxConcurrentCommands
    ) {
      throw new Error("Maximum concurrent command limit reached.");
    }

    this.activeCommands++;

    const stdoutCapture = new OutputCapture(
      COMMAND_EXECUTOR_CONFIG.maxOutputBytes,
    );

    const stderrCapture = new OutputCapture(
      COMMAND_EXECUTOR_CONFIG.maxOutputBytes,
    );

    const startedAt = Date.now();

    let exitCode: number | null = null;
    let status: CommandStatus = "failed";

    try {
      const result = await this.sandboxService.runCommand(
        sandbox,
        {
          cmd: input.command,
          args: input.args,
          timeoutMs,
          stdout: stdoutCapture,
          stderr: stderrCapture,
          ...(input.signal && { signal: input.signal}),
          ...(input.cwd && { cwd: input.cwd }),
        },
      );

      exitCode = result.exitCode;

      if (exitCode === 137) {
        status = "timed_out";
      } else if (exitCode === 0) {
        status = "success";
      } else {
        status = "failed";
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        status = "cancelled";
      } else if (
        error instanceof Error &&
        (
          error.name === "TimeoutError" ||
          /timed?\s*out|timeout/i.test(error.message)
        )
      ) {
        status = "timed_out";
      } else {
        status = "failed";

        const message =
          error instanceof Error
            ? error.message
            : String(error);

        if (!stderrCapture.getOutput()) {
          stderrCapture.end(message);
        }
      }
      
    } finally {
      this.activeCommands--;
    }

    return {
      command: input.command,
      args: input.args,
      status,
      exitCode,
      stdout: stdoutCapture.getOutput(),
      stderr: stderrCapture.getOutput(),
      durationMs: Date.now() - startedAt,
      outputTruncated:
        stdoutCapture.truncated ||
        stderrCapture.truncated,
    };
  }

  private validateCommand(
    command: string,
    args: string[],
  ): asserts command is AllowedCommand {
    if (
      !COMMAND_EXECUTOR_CONFIG.allowedCommands.includes(
        command as AllowedCommand,
      )
    ) {
      throw new Error(`Command not allowed: ${command}`);
    }

    if (!Array.isArray(args) || args.some(
      (arg) => typeof arg !== "string",
    )) {
      throw new Error("Invalid command arguments.");
    }

    if (command === "npm") {
      this.validateNpmCommand(args);
    }

    if (command === "node") {
      this.validateNodeCommand(args);
    }
  }

  private validateNpmCommand(args: string[]): void {
    const [subcommand, script] = args;

    const allowedVersionCommands = [
        ["--version"],
        ["-v"],
    ];

    if (
        allowedVersionCommands.some(
        (allowed) =>
            allowed.length === args.length &&
            allowed.every((value, index) => args[index] === value),
        )
    ) {
        return;
    }

    const blockedFlags = [
      "-g",
      "--global",
      "--prefix",
      "--workspace",
      "-w",
      "--script-shell",
    ];

    if (args.some((arg) => blockedFlags.includes(arg))) {
      throw new Error("Unsupported npm option.");
    }

    if (
      subcommand === "install" ||
      subcommand === "ci"
    ) {
      return;
    }

    if (
      subcommand === "run" &&
      COMMAND_EXECUTOR_CONFIG.allowedNpmScripts.includes(
        script as (typeof COMMAND_EXECUTOR_CONFIG.allowedNpmScripts)[number],
      )
    ) {
      return;
    }

    throw new Error(
      `npm command not allowed: ${args.join(" ")}`,
    );
  }

  private validateNodeCommand(args: string[]): void {
    if (
      args.length === 0 ||
      args[0]?.startsWith("-") ||
      args.some((arg) => arg.startsWith("-"))
    ) {
      throw new Error(
        "Node must be executed with a script path, not arbitrary flags.",
      );
    }
  }
}
