import { prisma } from "../../config/prisma.js";

export class MessageService {
  async create(data: {
    conversationId: string;
    role: "USER" | "ASSISTANT" | "SYSTEM";
    content: string;
  }) {
    return prisma.message.create({
      data,
    });
  }

  async getByConversationId(conversationId: string) {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: {
        createdAt: "asc",
      },
    });
  }
}