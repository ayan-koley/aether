# Aether Database Schema

## Purpose

PostgreSQL stores application metadata and history. The E2B sandbox stores the generated project's working files during execution.

Do not store generated source files as database rows in the first version.

## Models

### User

Represents an Aether account.

- `id`: primary key
- `email`: unique email
- `createdAt`, `updatedAt`

Authentication can be added using the chosen auth provider. Every project must have an owner.

### Project

Represents one generated website.

- `id`: primary key
- `userId`: project owner
- `name`: user-visible project name
- `status`: `creating`, `active`, `archived`, `failed`
- `sandboxId`: E2B sandbox identifier, nullable
- `previewUrl`: latest preview URL, nullable
- `createdAt`, `updatedAt`

### Conversation

Represents the conversation associated with a project.

- `id`: primary key
- `projectId`: related project
- `createdAt`, `updatedAt`

### Message

Stores user prompts and assistant responses.

- `id`: primary key
- `conversationId`: related conversation
- `role`: `user`, `assistant` or `system`
- `content`: message text
- `createdAt`

Avoid storing API keys or other secrets in messages.

### Execution

Represents one generation or modification attempt.

- `id`: primary key
- `projectId`: related project
- `messageId`: triggering user message, nullable
- `status`: `planning`, `executing`, `checking`, `ready`, `failed`, `cancelled`
- `summary`: short result summary, nullable
- `errorSummary`: bounded error summary, nullable
- `retryCount`: number of repair attempts
- `startedAt`, `finishedAt`, `createdAt`

## Relationships

```text
User 1 ------ N Project
Project 1 -- N Conversation
Conversation 1 -- N Message
Project 1 ---- N Execution
Message 1 ---- N Execution (optional trigger)
```

## Persistence rules

- Check project ownership on every project, conversation and execution request.
- Store sandbox IDs as provider references, not credentials.
- Store only the latest preview URL on Project; an execution can store its own result summary.
- Keep detailed logs bounded. If log retention becomes important, move large logs to object storage.
- Sandbox files are not durable database storage. Implement snapshots, Git integration or object-storage export before promising permanent project persistence.

## Prisma implementation

Define these models in `apps/server/prisma/schema.prisma`. Use Prisma migrations to evolve the schema. Keep database access behind server-side repository/service functions rather than calling Prisma from Express route handlers.
