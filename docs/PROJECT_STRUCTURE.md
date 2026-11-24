# Aether Project Structure

## Stack

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- LLM: Google Gemini API (`@google/genai`)
- Code execution: E2B Sandbox (`e2b`)
- Database: PostgreSQL + Prisma ORM
- Package manager: npm workspaces

Aether is a single-backend application. The backend owns the agent workflow and controls the sandbox. Generated user applications run inside isolated E2B sandboxes, not on the Aether server.

## Directory tree

```text
aether/
├── apps/
│   ├── web/                         # React application for the Aether UI
│   │   ├── public/
│   │   └── src/
│   │       ├── app/                 # App entry, router and page composition
│   │       ├── components/
│   │       │   ├── chat/            # Prompt input and conversation messages
│   │       │   ├── preview/         # Generated website preview frame
│   │       │   ├── projects/        # Project list and project controls
│   │       │   └── ui/              # Reusable UI components
│   │       ├── hooks/               # React hooks for API and UI state
│   │       ├── lib/                 # API client and frontend utilities
│   │       ├── types/               # Frontend-only types
│   │       ├── main.tsx             # React bootstrap
│   │       └── vite-env.d.ts
│   │
│   └── server/                      # Aether API and agent runtime
│       ├── prisma/
│       │   ├── schema.prisma        # Database models
│       │   └── migrations/
│       └── src/
│           ├── config/              # Environment validation and config
│           ├── middleware/          # Auth, validation and error middleware
│           ├── routes/              # Express route registration
│           ├── modules/
│           │   ├── projects/        # Project CRUD and project context
│           │   ├── conversations/   # Chat history and messages
│           │   ├── prompts/         # Prompt construction and context selection
│           │   ├── agent/            # Gemini client and plan generation
│           │   ├── execution/       # Plan validation and operation runner
│           │   ├── sandbox/         # E2B lifecycle, files and commands
│           │   ├── preview/         # Development server and preview URL
│           │   └── recovery/        # Build/runtime error repair loop
│           ├── services/            # Shared infrastructure services
│           ├── utils/               # Logging and common helpers
│           ├── app.ts               # Express app configuration
│           └── server.ts            # HTTP server startup
│
├── packages/
│   └── shared/
│       └── src/                     # API contracts and shared types
│
├── docs/                            # Product and engineering documentation
├── .env.example
├── .gitignore
├── package.json                    # npm workspace root
└── README.md
```

## File and module responsibilities

### `apps/web`

- `app/`: Defines routes such as the dashboard and `/project/:projectId`.
- `components/chat/`: Sends user requests and displays assistant progress.
- `components/preview/`: Displays the sandbox preview URL in an iframe.
- `components/projects/`: Displays and selects saved projects.
- `hooks/`: Holds reusable React state and data-fetching hooks.
- `lib/api-client.ts`: Centralizes calls to the Aether backend.
- `main.tsx`: Mounts the React application.

### `apps/server`

- `config/`: Loads and validates environment variables. Fail at startup if required secrets are missing.
- `routes/`: Maps HTTP endpoints to module handlers; keep business logic out of route files.
- `projects/`: Creates projects and retrieves project metadata.
- `conversations/`: Stores conversation turns and associates them with projects.
- `prompts/`: Builds Gemini input from the user request and relevant project context.
- `agent/`: Calls Gemini and parses its structured implementation plan.
- `execution/`: Validates the plan and runs approved operations through the sandbox module.
- `sandbox/`: Creates, resumes, pauses and destroys E2B sandboxes; reads/writes files and runs commands.
- `preview/`: Starts the generated app's dev server and returns its E2B-hosted URL.
- `recovery/`: Collects build/runtime errors and requests a bounded repair plan from Gemini.
- `services/`: Shared database, logger and other infrastructure clients.
- `app.ts`: Creates the Express app and registers middleware/routes.
- `server.ts`: Starts listening and handles graceful shutdown.

### `packages/shared`

Keep only contracts used by both frontend and backend here, such as project status, execution status and API response types. Do not put server-only code or secrets in this package.

## Initial implementation boundaries

- Aether initially generates **React + Vite** websites only.
- The Aether frontend and backend are separate from the generated website.
- Each user project gets its own isolated sandbox.
- The backend is the only component allowed to call Gemini and E2B.
- Do not add Redis, a queue, microservices or multiple agents in the first version.
- Persist project metadata and conversation history in PostgreSQL. Keep generated source files in the sandbox initially; add durable snapshots or Git/object storage before relying on long-lived projects in production.
