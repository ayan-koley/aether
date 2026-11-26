import { Sandbox } from "@vercel/sandbox";
import type { SandboxFile, SandboxInstance } from "./sandbox.types.js";
import { SANDBOX_CONFIG } from "./sandbox.constants.js"
import type { Writable } from 'node:stream'

export class SandboxService {
    async create(name: string) {
        return Sandbox.create({
            runtime: SANDBOX_CONFIG.runtime,
            timeout: SANDBOX_CONFIG.timeout,
            ports: [5173],
            name
        })
    }

    // Stop a sandbox and save its filesystem snapshot
    async pause(sandbox: SandboxInstance): Promise<void> {
        await sandbox.stop();
    }
    
    // Resume a previously stopped sandbox
    async resume(name: string): Promise<SandboxInstance> {
        return Sandbox.get({
            name,
            resume: true,
        });
    }

    // Retrieve an existing sandbox
    async get(name: string): Promise<SandboxInstance> {
        return Sandbox.get({ name });
    }

    // Permanently delete a sandbox
    async destroy(sandbox: SandboxInstance): Promise<void> {
        await sandbox.delete();
    }

    async writeFiles(sandbox: SandboxInstance, files: SandboxFile[]) {
        await sandbox.writeFiles(files);
    }

    async runCommand(sandbox: SandboxInstance, 
        options: {
            cmd: string;
            args: string[];
            detached?: boolean;
            timeoutMs?: number;
            signal?: AbortSignal;
            cwd?: string;
            stdout?: Writable;
            stderr?: Writable;
        }
    ) {
        const { cmd, args, detached = false, timeoutMs = SANDBOX_CONFIG.timeout, } = options;
        return sandbox.runCommand(options);
    }

    async getPreviewUrl(sandbox: SandboxInstance, port: number) {
        return sandbox.domain(port);
    }

    // Read a file
    async readFile(sandbox: SandboxInstance, filePath: string) {
        return sandbox.readFileToBuffer({ path: filePath });
    }

    async createDirectory(sandbox: SandboxInstance, directoryPath: string) {
        return sandbox.mkDir(directoryPath);
    }
}