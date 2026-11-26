import path from "node:path";

import type { SandboxInstance } from "../sandbox/sandbox.types.js";
import { SandboxService } from "../sandbox/sandbox.service.js";
import { PathValidatorService } from "./path-validator.service.js";

export interface ProjectFile {
  path: string;
  content: string;
}

export class FileManagerService {
  constructor(
    private readonly sandboxService: SandboxService,
    private readonly pathValidator: PathValidatorService,
  ) {}

  async readFile(
    sandbox: SandboxInstance,
    projectRoot: string,
    requestedPath: string,
  ): Promise<string> {
    const safeRelativePath = this.pathValidator.validate(
      projectRoot,
      requestedPath,
    );

    const absolutePath = path.posix.join(
      projectRoot,
      safeRelativePath,
    );

    const buffer = await this.sandboxService.readFile(
      sandbox,
      absolutePath,
    );

    if (buffer === null) {
      throw new Error(`File not found: ${requestedPath}`);
    }

    return buffer.toString("utf8");
  }

  async writeFiles(
    sandbox: SandboxInstance,
    projectRoot: string,
    files: ProjectFile[],
  ): Promise<void> {
    // Validate every path before writing any file.
    const validatedFiles = files.map((file) => {
      const safeRelativePath = this.pathValidator.validate(
        projectRoot,
        file.path,
      );

      return {
        path: path.posix.join(projectRoot, safeRelativePath),
        content: Buffer.from(file.content, "utf8"),
      };
    });

    await this.sandboxService.writeFiles(
      sandbox,
      validatedFiles,
    );
  }
}