import { prisma } from "../../config/prisma.js";

export class ExecutionService {
  async create(data: {
    projectId: string;
    conversationId: string;
    status?: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED";
  }) {
    return prisma.execution.create({
      data: {
        projectId: data.projectId,
        conversationId: data.conversationId,
        status: data.status ?? "PENDING",
      },
    });
  }

  async updateStatus(
    id: string,
    status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED",
    errorMessage?: string,
  ) {
    return prisma.execution.update({
      where: { id },
      data: {
        status,
        errorMessage,
      },
    });
  }

  async getById(id: string) {
    return prisma.execution.findUnique({
      where: { id },
    });
  }

  async getByProjectId(projectId: string) {
    return prisma.execution.findMany({
        where: {
        conversation: {
            projectId,
        },
        },
        orderBy: {
        createdAt: "desc",
        },
  });
}
}