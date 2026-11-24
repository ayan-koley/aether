# Aether Execution Flow

## 1. New project generation

1. The user creates a project and submits a website prompt from React.
2. The API validates the request and checks project ownership.
3. The backend creates a project record and conversation.
4. The sandbox module creates an E2B sandbox and initializes a React + Vite starter.
5. The prompt processor prepares the user request, starter-project context and required plan schema.
6. The Gemini agent requests a structured implementation plan.
7. The backend parses and validates the plan.
8. The execution engine applies approved file and package operations inside E2B.
9. The backend runs the build command and starts the Vite development server.
10. The preview manager checks readiness and obtains the E2B host URL.
11. The backend saves execution status and preview metadata.
12. The frontend displays the preview.

## 2. Follow-up modification

1. The user sends a new prompt for an existing project.
2. The backend loads the project, conversation and associated sandbox.
3. The sandbox module reconnects to or resumes the project sandbox.
4. The backend gathers the file tree and relevant source files.
5. Gemini returns a change plan, including the files to inspect or modify.
6. The backend validates and executes the plan.
7. The backend checks the build and preview server.
8. The frontend refreshes the preview and displays the result.

Modify the existing project. Do not overwrite the entire project for a small change.

## 3. Plan contract

Use a versioned JSON contract and validate it with Zod before execution. A plan should contain an action summary and a list of typed operations. Example:

```json
{
  "version": 1,
  "summary": "Create a responsive SaaS landing page",
  "operations": [
    {
      "type": "write_file",
      "path": "src/App.tsx",
      "content": "..."
    },
    {
      "type": "write_file",
      "path": "src/App.css",
      "content": "..."
    },
    {
      "type": "install_packages",
      "packages": ["lucide-react"]
    }
  ]
}
```

This is an example contract, not an instruction to accept arbitrary operations. Define exact Zod schemas for every operation type. Reject unknown operation types and unexpected fields.

## 4. Operation execution rules

- Resolve every file path against the sandbox project root and reject traversal outside it.
- Limit file size, total plan size and number of operations.
- Allow package installation only through the package-install operation; validate package names and apply timeouts.
- Allow only explicitly approved command templates. Do not accept arbitrary shell commands directly from Gemini.
- Capture stdout, stderr, exit code and duration.
- Stop execution when an operation fails unless the plan explicitly supports a safe continuation.
- Record each execution and its final status.

## 5. Error recovery

1. Detect a failed build or failed server startup.
2. Capture a bounded error log and relevant source files.
3. Ask Gemini for a repair plan using the same structured contract.
4. Validate the repair plan.
5. Apply the repair inside the same sandbox.
6. Run the check again.
7. Retry at most two times initially.
8. If still failing, mark the execution as failed and show a useful error summary to the user.

Do not let the model repeatedly retry without a limit. Do not automatically repair arbitrary runtime behavior without a reproducible error signal.

## 6. Preview readiness

- Start Vite with host `0.0.0.0` and a known port such as `5173`.
- Run it as a background process using the E2B command API.
- Poll a health/readiness URL with a timeout.
- Obtain the external URL through the E2B SDK's port-host method.
- Return the URL only after the server is ready.
- Treat the preview URL as temporary unless the provider documents otherwise.

## 7. Suggested execution statuses

`queued` → `planning` → `executing` → `checking` → `ready`

Failure states: `failed`, `cancelled`.

For the first version, these statuses are persisted in PostgreSQL and returned through ordinary API polling. A queue system is not required.
