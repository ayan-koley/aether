import { prisma } from "../../config/prisma.js";

export class ConversationService {
  async create(projectId: string) {
    return prisma.conversation.create({
      data: {
        projectId,
      },
    });
  }

  async getById(id: string) {
    return prisma.conversation.findUnique({
      where: { id },
    });
  }

  async getByProjectId(projectId: string) {
    return prisma.conversation.findMany({
      where: { projectId },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }
}