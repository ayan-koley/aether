# Aether Architecture

## 1. Goal

Aether turns a user's natural-language request into a running React website. The user can view the result, send follow-up prompts and ask Aether to modify the existing project.

Aether is a focused website-generation agent, not a general-purpose autonomous software engineering platform.

## 2. Technology

| Layer | Technology | Responsibility |
|---|---|---|
| Web client | React, Vite, TypeScript | Chat, project dashboard and preview |
| API | Node.js, Express, TypeScript | Authenticates requests and coordinates work |
| LLM | Gemini API, `@google/genai` | Plans code changes and diagnoses errors |
| Sandbox | E2B, `e2b` SDK | Isolated filesystem, terminal and running app |
| Database | PostgreSQL, Prisma | Users, projects, conversations and execution metadata |

## 3. Main components

### React frontend

The frontend sends prompts to the backend, displays execution progress and embeds the preview URL returned by the backend. It never receives Gemini or E2B secret keys.

### Express backend

The backend is the control plane. It validates requests, loads project context, calls Gemini, validates the returned plan, invokes sandbox operations and stores status/results.

### Prompt processor

Builds a bounded prompt containing:
- User request.
- Selected project metadata.
- Relevant file tree and file contents when needed.
- Recent conversation context.
- A strict output schema and safety rules.

Do not send the entire project to Gemini on every turn. Select relevant files and summarize the rest.

### Gemini agent

Gemini returns a structured plan. It does not directly access the server, database or sandbox. The backend validates every operation before execution.

### Execution engine

Accepts only supported operations, for example:
- `write_file`
- `edit_file`
- `delete_file`
- `install_packages`
- `run_command`
- `start_dev_server`

Validate paths, operation types, package names and commands. Reject paths that escape the project directory and commands outside the allowed policy.

### Sandbox manager

Creates one E2B sandbox for a project, prepares the React + Vite workspace, performs file operations and runs commands. Store the E2B sandbox identifier and lifecycle state in the database.

### Preview manager

Starts the Vite development server on its configured port (normally `5173`) bound to `0.0.0.0`, waits for readiness, then obtains the public host URL using the E2B SDK. Return the URL to the frontend.

### Error recovery

Collects build or startup errors, sends the relevant error plus affected file context to Gemini, validates the proposed repair plan and retries a limited number of times. Stop and show the error when the retry limit is reached.

## 4. Request flow

```text
React UI
  |
  | POST prompt + projectId
  v
Express API
  |
  +--> Load project and conversation
  |
  +--> Prompt processor
  |
  +--> Gemini: generate structured plan
  |
  +--> Validate plan
  |
  +--> Execution engine
  |      |
  |      +--> E2B sandbox: write files / install packages / run commands
  |
  +--> Start or verify Vite server
  |
  +--> Save result and preview URL
  |
  v
React UI displays live preview
```

For a follow-up request, use the existing project sandbox and current files. Do not create a fresh project unless the user explicitly starts a new project.

## 5. Project and sandbox lifecycle

1. Create a project record.
2. Create an E2B sandbox and record its ID.
3. Initialize the React + Vite starter project in the sandbox.
4. Generate and execute the first implementation plan.
5. Start the Vite server and return the preview URL.
6. Keep the sandbox associated with the project while it is active.
7. On later prompts, resume or reconnect to the existing sandbox and modify its files.
8. Pause or destroy inactive sandboxes according to a defined lifecycle policy.

Sandbox lifetime and persistence are provider-controlled. Do not assume a sandbox or its filesystem lasts forever. Before production use, implement a durable project backup/export strategy.

## 6. Security boundaries

- Keep `GEMINI_API_KEY`, `E2B_API_KEY` and `DATABASE_URL` on the backend only.
- Never execute raw model output as shell input.
- Validate model output against a schema and an allowlist of operations.
- Restrict file paths to the project workspace.
- Apply command timeouts, output limits and dependency-install limits.
- Keep generated applications isolated from the Aether backend.
- Do not expose internal service credentials to generated applications.
- Treat user prompts, generated code, terminal output and project files as untrusted input.
- Apply authentication, project ownership checks and request limits before public launch.

## 7. Deliberately out of scope for the first version

Redis, BullMQ, distributed workers, microservices, Kubernetes, multi-agent orchestration and support for multiple frameworks. Add infrastructure only when measured usage requires it.
