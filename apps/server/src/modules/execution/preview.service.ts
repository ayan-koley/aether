
import { SANDBOX_CONFIG } from "../sandbox/sandbox.constants.js";
import type { SandboxInstance } from "../sandbox/sandbox.types.js";
import { SandboxService } from "../sandbox/sandbox.service.js";

export class PreviewService {
  constructor(
    private readonly sandboxService: SandboxService,
  ) {}

  async start(sandbox: SandboxInstance): Promise<string> {
    // 1. Start Vite in the background
    const devServer = await this.sandboxService.runCommand(
      sandbox,
      {
        cmd: "npm",
        args: [
            "run", "dev", "--",
            "--host", "0.0.0.0",
            "--port", `${String(SANDBOX_CONFIG.port)}`,
        ],
        detached: true,
      }
    );

    // 2. Automatically check readiness
    const readiness = await this.sandboxService.runCommand(
      sandbox,
      {
        cmd: "bash",
        args: [
            "-c",
            `for i in $(seq 1 30); do
            if curl -fsS http://127.0.0.1:${SANDBOX_CONFIG.port}/ >/dev/null; then
                exit 0
            fi
                sleep 1
            done
            exit 1`,
        ],
        timeoutMs: 35_000
      }
    );

    // 3. Handle timeout
    if (readiness.exitCode !== 0) {
      await devServer.kill("SIGTERM");

      throw new Error(
        "Vite failed to become ready within 30 seconds.",
      );
    }

    // 4. Return preview URL
    return this.sandboxService.getPreviewUrl(sandbox, SANDBOX_CONFIG.port);
  }
}
