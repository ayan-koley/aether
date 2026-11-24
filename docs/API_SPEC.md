# Aether API Specification

Base path: `/api`

All endpoints return JSON. Require authentication for project-specific endpoints. The backend must verify that the authenticated user owns the requested project.

## Common response format

Success:

```json
{
  "data": {},
  "error": null
}
```

Failure:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request is invalid"
  }
}
```

## Endpoints

### Health

`GET /health`

Checks whether the API process is responding. Do not expose secrets or internal infrastructure details.

### Projects

`POST /projects`

Create a project.

Request:

```json
{
  "name": "SaaS landing page"
}
```

Response data includes the created project ID and status.

`GET /projects`

List projects owned by the authenticated user.

`GET /projects/:projectId`

Get project metadata, status and latest preview URL.

`DELETE /projects/:projectId`

Archive or delete a project according to the product's retention policy. Clean up its sandbox when appropriate.

### Conversations

`GET /projects/:projectId/conversation`

Get the conversation history for a project.

### Generate or modify

`POST /projects/:projectId/messages`

Request:

```json
{
  "content": "Create a responsive SaaS landing page with pricing cards."
}
```

The backend creates a user message and an execution record, then starts the agent workflow. Return an execution ID and initial status. The client can poll the execution endpoint.

### Execution status

`GET /executions/:executionId`

Response data:

```json
{
  "id": "execution-id",
  "status": "executing",
  "summary": null,
  "errorSummary": null,
  "previewUrl": null
}
```

The response must be scoped to a project owned by the authenticated user.

### Preview

`GET /projects/:projectId/preview`

Returns the latest known preview URL and readiness state. The preview itself is served by the sandbox provider, not proxied through the API by default.

## Status values

- `planning`: Gemini is preparing a plan.
- `executing`: operations are being applied in the sandbox.
- `checking`: build and server readiness checks are running.
- `ready`: preview is available.
- `failed`: execution could not complete.
- `cancelled`: execution was cancelled.

## API behavior

- Validate request bodies with schemas.
- Enforce request size and rate limits.
- Use consistent HTTP status codes.
- Do not return raw secrets, full internal stack traces or unrestricted terminal output.
- Use pagination for project and message history as it grows.
- A later version may use Server-Sent Events for live progress; initial polling is sufficient.
