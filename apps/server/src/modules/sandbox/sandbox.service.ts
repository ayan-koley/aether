import { Sandbox } from "@vercel/sandbox";
import type { SandboxFile, SandboxInstance } from "./sandbox.types.js";
import { SANDBOX_CONFIG } from "./sandbox.constants.js"

export class SandboxService {
    async create() {
        return Sandbox.create({
            runtime: SANDBOX_CONFIG.runtime,
            timeout: SANDBOX_CONFIG.timeout,
            ports: [5173]
        })
    }

    async writeFiles(sandbox: SandboxInstance, files: SandboxFile[]) {
        await sandbox.writeFiles(files);
    }

    async runCommand(sandbox: SandboxInstance, options: {cmd: string, args: string[], detached?: boolean, timeoutMs?: number}) {
        const { cmd, args, detached = false, timeoutMs = SANDBOX_CONFIG.timeout, } = options;
        return sandbox.runCommand({
            cmd,
            args,
            detached,
            timeoutMs
        })
    }

    async getPreviewUrl(sandbox: SandboxInstance, port: number) {
        return sandbox.domain(port);
    }
}