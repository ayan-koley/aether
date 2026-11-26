import { SandboxService } from "../sandbox/sandbox.service.js";
import { ProjectService } from "./project.service.js";

export class ProjectProvisioningService {
  constructor(
    private readonly projectService: ProjectService,
    private readonly sandboxService: SandboxService,
  ) {}

  async createProject(name: string) {
    // 1. Create project record in PostgreSQL.
    const project = await this.projectService.createProject(name);

    try {
        // 2. Create Vercel Sandbox.
        // TODO: aether-test-${Date.now()} add this to name but later i use crypto to generate
        const sandbox = await this.sandboxService.create(`aether-test-${Date.now()}`);

        const updatedProject = await this.projectService.saveSandboxName(
            project.id,
            sandbox.name
        );
     

      return {
        project: updatedProject,
        sandbox,
      };
    } catch (error) {
      // 4. Record creation failure.
      await this.projectService.updateStatus(
        project.id,
        "FAILED",
      );

      throw error;
    }
  }
}