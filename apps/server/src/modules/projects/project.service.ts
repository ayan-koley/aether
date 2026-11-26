import { prisma } from "../../config/prisma.js";

export type ProjectStatus =
  | "CREATING"
  | "INITIALIZING"
  | "INSTALLING"
  | "RUNNING"
  | "STOPPED"
  | "FAILED"
  | "DELETED";

export class ProjectService {
    async createProject(name: string) {
        return prisma.project.create({
            data: {
            name,
            status: "CREATING",
            },
        });
    }

    async saveSandboxName(projectId: string, sandboxName: string) {
        return prisma.project.update({
            where: { id: projectId },
            data: {
            sandboxName,
            status: "INITIALIZING",
            },
        });
    }

  async updateStatus(
    projectId: string,
    status: ProjectStatus,
  ) {
    return prisma.project.update({
      where: { id: projectId },
      data: { status },
    });
  }

  async getProject(projectId: string) {
    return prisma.project.findUnique({
      where: { id: projectId },
    });
  }

  async getProjectBySandboxId(sandboxName: string) {
    return prisma.project.findUnique({
      where: { sandboxName },
    });
  }
}