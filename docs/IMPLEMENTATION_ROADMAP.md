# Aether Implementation Roadmap

Build and verify one milestone at a time. Do not start the next milestone until the previous one works.

## Milestone 1 — Monorepo foundation

- [ done ] Create the `aether` repository.
- [ done ] Configure npm workspaces for `apps/web`, `apps/server` and `packages/shared`.
- [ ! ] Create React + Vite + TypeScript frontend.
- [ done ] Create Express + TypeScript backend.
- [ done ] Add environment-variable validation.
- [ done ] Add `/api/health`.
- [ done ] Confirm both apps run locally.

**Done when:** React can call the Express health endpoint.

## Milestone 2 — E2B proof of concept

- [ done ] Initialize vercel sandbox SDK.
- [ done ] Create a sandbox from the backend.
- [ done ] Create a minimal React + Vite project in the sandbox.
- [ done ] Install dependencies.
- [ done ] Start Vite on `0.0.0.0:5173`.
- [ done ] Wait for readiness and retrieve the sandbox host URL.
- [ done ] Display the URL in a browser.

**Done when:** A website created inside E2B is reachable through its preview URL.

## Milestone 3 — Sandbox manager and execution engine

- [ ] Implement sandbox create/get/pause/destroy operations.
- [ ] Implement safe file read/write operations.
- [ ] Implement bounded command execution and log capture.
- [ ] Implement project-root path validation.
- [ ] Implement dependency installation with limits.
- [ ] Save sandbox ID and project status.

**Done when:** The backend can create, edit and run a website without Gemini.

## Milestone 4 — Gemini integration

- [ ] Install `@google/genai`.
- [ ] Keep the Gemini API key on the backend.
- [ ] Define a versioned JSON plan schema with Zod.
- [ ] Add prompt construction and project context selection.
- [ ] Ask Gemini for structured file-operation plans.
- [ ] Parse and validate every response.
- [ ] Reject unsupported or unsafe operations.

**Done when:** A prompt produces a valid plan that the backend can inspect safely.

## Milestone 5 — End-to-end generation

- [ ] Connect Gemini plans to the execution engine.
- [ ] Create a project sandbox on the first request.
- [ ] Execute the plan.
- [ ] Run a production build check.
- [ ] Start or verify the development server.
- [ ] Persist messages and execution status.
- [ ] Return a working preview URL.

**Done when:** A user prompt creates a working website and the UI displays it.

## Milestone 6 — Conversational editing

- [ ] Load the existing sandbox for follow-up prompts.
- [ ] Collect the current file tree and relevant files.
- [ ] Include recent conversation context.
- [ ] Generate minimal change plans.
- [ ] Apply changes without replacing unrelated files.
- [ ] Refresh the preview after successful changes.

**Done when:** A follow-up prompt changes the existing website and preserves previous work.

## Milestone 7 — Error recovery

- [ ] Capture install, build and server errors.
- [ ] Send bounded error context to Gemini.
- [ ] Validate the proposed repair plan.
- [ ] Retry a maximum of two times initially.
- [ ] Save final status and a user-friendly error summary.

**Done when:** A common build error can be repaired automatically, with a clear failure state when repair does not work.

## Milestone 8 — Reliability and launch preparation

- [ ] Add authentication and project ownership checks.
- [ ] Add rate limits, timeouts and request-size limits.
- [ ] Add sandbox inactivity and cleanup policy.
- [ ] Add durable project export/backup.
- [ ] Add tests for plan validation and sandbox operations.
- [ ] Review sandbox network access and secret isolation.
- [ ] Add usage limits and cost monitoring.

**Done when:** Users cannot access each other's projects, execution is bounded and project files can survive sandbox expiration.

## Not in the initial roadmap

Do not add Redis, BullMQ, microservices, Kubernetes, multi-agent orchestration or multiple generated frameworks until a real requirement justifies them.
