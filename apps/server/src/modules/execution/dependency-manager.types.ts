export interface InstallDependenciesInput {
  packages: string[];
}

export interface InstallDependenciesResult {
  success: boolean;
  packages: string[];
  status: "success" | "failed" | "timed_out" | "cancelled";
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
}