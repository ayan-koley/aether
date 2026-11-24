
import type { SandboxInstance } from "../sandbox/sandbox.types.js";
import { SandboxService } from "../sandbox/sandbox.service.js";

export class ProjectInitializerService {
  constructor(
    private readonly sandboxService: SandboxService,
  ) {}

  async initialize(sandbox: SandboxInstance): Promise<void> {
    await this.sandboxService.runCommand(
      sandbox,
        {
            cmd: "npm",
            args: ["create", "vite@latest", ".", "--", "--template", "react-ts"],
        }
    );

    await this.sandboxService.runCommand(
      sandbox,
        {
            cmd: "npm",
            args: ["install"]
        }
    );

    await this.sandboxService.runCommand(sandbox, {
        cmd: "node",
        args: [
            "-e",
            `const fs = require("fs");

            const file = "vite.config.ts";
            let config = fs.readFileSync(file, "utf8");

            config = config.replace(
            "plugins: [react()],",
            'plugins: [react()],\\n  server: {\\n    host: "0.0.0.0",\\n    port: 5173,\\n    allowedHosts: [".vercel.run"],\\n  },'
            );

            fs.writeFileSync(file, config);`,
        ],
    });
  }
}
