import path from "node:path";

export class PathValidatorService {
  validate(projectRoot: string, requestedPath: string): string {
    if (!projectRoot || !path.posix.isAbsolute(projectRoot)) {
      throw new Error("Project root must be an absolute path");
    }

    if (!requestedPath || requestedPath.trim().length === 0) {
      throw new Error("File path cannot be empty");
    }

    // Reject suspicious or cross-platform paths.
    if (
      requestedPath.includes("\0") ||
      requestedPath.includes("\\") ||
      path.posix.isAbsolute(requestedPath) ||
      /^[a-zA-Z]:/.test(requestedPath)
    ) {
      throw new Error("Invalid project file path");
    }

    const root = path.posix.resolve(projectRoot);
    const resolvedPath = path.posix.resolve(root, requestedPath);

    // Calculate the path from the project root to the requested file.
    const relativePath = path.posix.relative(root, resolvedPath);

    // Reject paths that escape the project root.
    if (
      relativePath === "" ||
      relativePath === ".." ||
      relativePath.startsWith("../") ||
      path.posix.isAbsolute(relativePath)
    ) {
      throw new Error("Path is outside the project root");
    }

    // Return a normalized relative path for sandbox file operations.
    return relativePath;
  }
}