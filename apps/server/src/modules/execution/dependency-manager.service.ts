import type { SandboxInstance } from "../sandbox/sandbox.types.js";

import { CommandExecutorService } from "./command-executor.service.js";
import { DEPENDENCY_CONFIG } from "./dependency-manager.constants.js";

import type {
  InstallDependenciesInput,
  InstallDependenciesResult,
} from "./dependency-manager.types.js";

export class DependencyManagerService {
  constructor(
    private readonly commandExecutor: CommandExecutorService,
  ) {}

  async install(
    sandbox: SandboxInstance,
    projectRoot: string,
    input: InstallDependenciesInput,
    signal?: AbortSignal,
  ): Promise<InstallDependenciesResult> {
    const packages = this.validatePackages(input.packages);

    const result = await this.commandExecutor.execute(sandbox, {
      command: "npm",
      args: [
        "install",
        "--no-audit",
        "--no-fund",
        ...packages,
      ],
      cwd: projectRoot,
      timeoutMs: DEPENDENCY_CONFIG.timeoutMs,
      ...(signal && { signal }),
    });

    return {
      success: result.status === "success",
      packages,
      status: result.status,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      durationMs: result.durationMs,
    };
  }

  private validatePackages(packages: string[]): string[] {
    if (!Array.isArray(packages) || packages.length === 0) {
      throw new Error("At least one package is required");
    }

    if (packages.length > DEPENDENCY_CONFIG.maxPackagesPerInstall) {
      throw new Error(
        `Maximum ${DEPENDENCY_CONFIG.maxPackagesPerInstall} packages allowed per installation`,
      );
    }

    const validatedPackages = packages.map((packageName) => {
      if (
        typeof packageName !== "string" ||
        packageName.length === 0 ||
        packageName.length > DEPENDENCY_CONFIG.maxPackageNameLength
      ) {
        throw new Error("Invalid package name");
      }

      // Accept normal and scoped npm package names, optionally with versions.
      const packagePattern =
        /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*(?:@[a-zA-Z0-9*^~<>=|.+ -]+)?$/;

      if (!packagePattern.test(packageName)) {
        throw new Error(`Invalid npm package specification: ${packageName}`);
      }

      // Reject URLs, local paths, Git references, and flags.
      if (
        packageName.startsWith("-") ||
        packageName.includes("/") && !packageName.startsWith("@") ||
        packageName.includes(":") ||
        packageName.includes("\\")
      ) {
        throw new Error(`Unsupported package specification: ${packageName}`);
      }

      return packageName;
    });

    return [...new Set(validatedPackages)];
  }
}