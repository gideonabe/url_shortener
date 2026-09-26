# URL Shortener API

A small URL-shortening HTTP service built with Node.js, Express, Prisma, and PostgreSQL. It creates a short code for a submitted URL and redirects requests for that code to the original URL.

> **Project status:** This is an in-progress project, not a production-hardened service. See [Known limitations](#known-limitations) before deploying it for public use.

## Contents

- [Features](#features)
- [Technology](#technology)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Environment configuration](#environment-configuration)
- [Database workflow](#database-workflow)
- [Run with Docker](#run-with-docker)
- [HTTP API](#http-api)
- [Load testing](#load-testing)
- [Project layout](#project-layout)
- [Operational notes](#operational-notes)
- [Known limitations](#known-limitations)

## Features

- Create a short URL from a submitted absolute URL.
- Generate seven-character short codes with Nano ID.
- Redirect short-code requests with HTTP `302 Found`.
- Store URLs and optional expiration timestamps in PostgreSQL using Prisma.
- Provide a basic health endpoint and a database diagnostic endpoint.
- Run the service directly with Node.js or in a Docker container.

## Technology

- Node.js 22 (the Docker image uses `node:22-alpine`)
- Express 5
- PostgreSQL
- Prisma ORM 6
- Zod request validation
- Docker
- k6 for the checked-in load-test scenario

## Requirements

For local development, install:

- Node.js 22 or a compatible supported release
- npm
- A reachable PostgreSQL database

For containerized use, install Docker. Database migrations also require the Prisma CLI provided by the project's npm dependencies.

## Getting started

1. Install dependencies:

	 ```sh
	 npm ci
	 ```

2. Create a `.env` file in the project root and set `DATABASE_URL` and `DIRECT_URL`. See [Environment configuration](#environment-configuration).

3. Generate the Prisma client and apply database migrations:

	 ```sh
	 npx prisma generate
	 npx prisma migrate dev --name init
	 ```

	 `migrate dev` creates a migration from the current Prisma schema and applies it to the development database. For an existing production migration history, use `npx prisma migrate deploy` instead; do not use `migrate dev` against production.

4. Start the development server:

	 ```sh
	 npm run dev
	 ```

	 The server listens on port `5000` by default. Set `PORT` to change it.

5. Check that the HTTP process responds:

	 ```sh
	 curl http://localhost:5000/health
	 ```

	 To confirm that database access works as well, use `GET /db-test`.

## Environment configuration

The application loads environment variables from `.env` in local development. Do not commit `.env` or share real database credentials. `.env` is excluded from Git and the Docker build context by the repository's ignore files.

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma Client at runtime. |
| `DIRECT_URL` | Yes for Prisma CLI database operations | Direct PostgreSQL connection string used by Prisma for schema/migration operations. |
| `PORT` | No | HTTP listening port; defaults to `5000`. |
| `NODE_ENV` | No | Controls whether the error handler includes a stack trace. Use `production` in deployments. |

Example values below are placeholders; replace the host, database, username, and password with your provider's values:

```dotenv
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://USER:PERCENT_ENCODED_PASSWORD@HOST:6543/DATABASE?pgbouncer=true
DIRECT_URL=postgresql://USER:PERCENT_ENCODED_PASSWORD@HOST:5432/DATABASE
```

If your provider supplies a transaction pooler and a direct/session connection, use the pooler URL for `DATABASE_URL` and the direct connection for `DIRECT_URL`, following the provider's Prisma instructions. URL-reserved characters in credentials must be percent-encoded.

When passing this file to Docker with `docker run --env-file .env`, leave the connection-string values unquoted. Docker may include literal quote characters in values written as `KEY="value"`; Prisma then rejects the URL because it does not begin with `postgresql://` or `postgres://`.

## Database workflow

The Prisma schema is in [`prisma/schema.prisma`](prisma/schema.prisma). It defines a `Url` table with:

| Field | Purpose |
| --- | --- |
| `id` | UUID primary key. |
| `shortCode` | Unique generated code used in redirect URLs. |
| `longUrl` | Destination URL. |
| `clicks` | Click counter column; it is not currently incremented by redirects. |
| `expiresAt` | Optional expiration time. Expired records are treated as not found. |
| `createdAt` / `updatedAt` | Record timestamps. |

Useful Prisma commands:

```sh
npx prisma generate
npx prisma migrate dev --name describe-your-change
npx prisma migrate deploy
npx prisma studio
```

Use `migrate dev` for local schema development and `migrate deploy` to apply checked-in migrations in a deployment. Do not use `prisma db push` as a substitute for a production migration history.

## Run with Docker

Build the image from the project root:

```sh
docker build -t url-shortener:local .
```

Start the API and pass the environment file to the container:

```sh
docker run --rm --name url-shortener --env-file .env -p 5000:5000 url-shortener:local
```

In another terminal, check the service:

```sh
curl http://localhost:5000/health
curl http://localhost:5000/db-test
```

`/health` only confirms that the HTTP process is responding; it does not verify the database. `/db-test` performs a Prisma query and therefore requires valid database configuration, a reachable PostgreSQL server, and an initialized schema.

Stop a foreground container with `Ctrl+C`. If you started a named container without `--rm`, stop and remove it with:

```sh
docker stop url-shortener
docker rm url-shortener
```

The image runs `npx prisma generate` during the build. It does not apply migrations automatically; manage schema changes with the Prisma CLI as a separate deployment step.

## HTTP API

The API is served on the same origin and port as the server. JSON request bodies should use `Content-Type: application/json`.

### `GET /health`

Liveness check for the HTTP process. It does not query PostgreSQL.

```http
GET /health
```

Example response (`200 OK`):

```json
{
	"status": "ok",
	"message": "URL shortener API is healthy"
}
```

### `GET /ping`

Minimal HTTP response useful for checking whether the server is reachable.

```http
GET /ping
```

Example response (`200 OK`):

```json
{
	"status": "ok"
}
```

### `GET /db-test`

Runs a database query for a hard-coded diagnostic short code and reports query duration and whether a record was found. This is a diagnostic endpoint, not a general database readiness contract.

```http
GET /db-test
```

Example response (`200 OK`):

```json
{
	"dbDuration": "3.21ms",
	"found": false
}
```

### `POST /api/v1/urls`

Creates a short URL. The request schema currently requires a valid URL in `longUrl`.

```http
POST /api/v1/urls
Content-Type: application/json
```

```json
{
	"longUrl": "https://example.com/articles/hello-world"
}
```

Example response (`201 Created`):

```json
{
	"status": "success",
	"data": {
		"id": "b3e2dc1a-0000-4000-8000-000000000000",
		"shortCode": "Ab3xYz9",
		"longUrl": "https://example.com/articles/hello-world"
	}
}
```

Validation failures return `400 Bad Request` with field-level validation details. Database or unexpected server errors are sent through the shared error handler.

### `GET /:shortCode`

Redirects to the stored destination with `302 Found`. For example, if creation returns `shortCode` `Ab3xYz9`, open:

```http
GET /Ab3xYz9
```

The response has a `Location` header containing the destination. Unknown or expired codes return `404 Not Found`.

## Load testing

The `load-test.js` script uses k6 and currently targets a hard-coded hosted service URL, not `localhost`. It sends a constant arrival rate of 45 requests per second for 30 seconds to `GET /health`, with thresholds of less than 1% failed requests and a 95th-percentile response time under 1 second.

Install k6 using the instructions for your operating system, then run:

```sh
k6 run load-test.js
```

This sends traffic to the configured hosted service. Only run it against a service you own or have permission to test. To use it locally, update `BASE_URL` in `load-test.js` to `http://localhost:5000` before running; the script does not currently accept a target URL from an environment variable.

The npm `test` script is a placeholder and exits with an error. There is no automated unit or integration test suite configured yet.

## Project layout

```text
.
├── prisma/
│   └── schema.prisma          # PostgreSQL data model and Prisma configuration
├── src/
│   ├── app.js                 # Express middleware and route registration
│   ├── server.js              # HTTP server startup and signal handling
│   ├── config/
│   │   └── prisma.js          # Shared Prisma Client instance
│   ├── middleware/
│   │   ├── error.middleware.js
│   │   └── validate.js
│   ├── modules/url/
│   │   ├── url.controller.js  # HTTP handlers
│   │   ├── url.routes.js      # URL creation route
│   │   ├── url.service.js     # URL persistence and lookup
│   │   └── url.validation.js  # Request schema
│   └── routes/
│       └── index.js           # Versioned API route registration
├── load-test.js               # k6 health endpoint scenario
├── Dockerfile
├── package.json
└── README.md
```

## Operational notes

- The process handles `SIGINT` and `SIGTERM` by closing the HTTP server.
- Helmet, CORS, compression, JSON and form parsing, and Morgan request logging are enabled in the Express application.
- The error middleware logs server errors. Stack traces are included in error responses only when `NODE_ENV=development`; set an explicit production value in deployment environments.
- The current health endpoint is a liveness check only. A production orchestrator that needs database readiness should use a dedicated readiness check with appropriate timeout and failure behavior.