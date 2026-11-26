import { AGENT_SYSTEM_PROMPT, AGENT_CONFIG } from "./agent.constants.js";
import type { AgentRequest } from "./agent.types.js";

export class PromptBuilderService {
  build(request: AgentRequest): string {
    const userPrompt = request.prompt.trim();

    if (!userPrompt) {
      throw new Error("User prompt cannot be empty");
    }

    if (userPrompt.length > 10_000) {
      throw new Error("User prompt is too long");
    }

    const files = (request.projectContext ?? [])
      .slice(0, AGENT_CONFIG.maxContextFiles);

    let remainingCharacters = AGENT_CONFIG.maxContextCharacters;

    const projectFiles = files.map((file) => {
      if (!file.path || !file.content) {
        throw new Error("Invalid project context file");
      }

      if (file.content.length > remainingCharacters) {
        throw new Error("Project context exceeds the allowed size");
      }

      remainingCharacters -= file.content.length;

      return {
        path: file.path,
        content: file.content,
      };
    });

    const conversationContext =
      request.conversationContext?.slice(0, 10_000) ?? "";

    return `
${AGENT_SYSTEM_PROMPT}

<user_request>
${userPrompt}
</user_request>

<conversation_context>
${conversationContext}
</conversation_context>

<existing_project_files>
${JSON.stringify(projectFiles, null, 2)}
</existing_project_files>

Generate a complete implementation plan.
Use the existing project structure when possible.
`;
  }
}