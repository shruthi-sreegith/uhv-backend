# UHV Backend API

A standalone Express REST API for creating and managing JSON records. Data is persisted in `backend/data/records.json`; no database or Maven is required.

## Requirements

- Node.js 20 or later
- npm (included with Node.js)

## Run locally

From the repository root:

```powershell
cd backend
npm install
npm start
```

The API listens on `http://127.0.0.1:3000` by default. For development with automatic restarts, use `npm run dev`.

### Configuration

Set these optional environment variables before starting the server:

| Variable | Default | Description |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Network interface to bind |
| `PORT` | `3000` | HTTP port (1–65535) |
| `CORS_ORIGIN` | `*` | Allowed frontend origin, or a comma-separated list of origins |

PowerShell example:

```powershell
$env:PORT = "4000"
$env:CORS_ORIGIN = "http://localhost:5173"
npm start
```

## API

All endpoints are prefixed with `/api`. JSON request bodies use `Content-Type: application/json`.

### Health

- `GET /api/health` — returns `{"status":"ok"}`.

### Records

Records have an API-managed `id`, `createdAt`, and `updatedAt`, plus a JSON object in `data`.

- `GET /api/records?limit=50&offset=0&q=text` — list records, optionally search their `data` values and paginate. `limit` is 1–100; `offset` is zero or greater. The response is `{"data":[...],"total":1,"limit":50,"offset":0}`.
- `POST /api/records` — create a record. Body: `{"data":{"name":"Example"}}`. Returns `201 Created` and the created record.
- `GET /api/records/:id` — retrieve a record.
- `PUT /api/records/:id` — replace all record data. Body: `{"data":{"name":"Updated"}}`.
- `PATCH /api/records/:id` — merge fields into record data. Body: `{"data":{"active":true}}`.
- `DELETE /api/records/:id` — delete a record. Returns `204 No Content`.

The single-record response shape is `{"data":{"id":"...","data":{},"createdAt":"...","updatedAt":"..."}}`. Missing records return `404`; invalid requests return a JSON `error` object with a stable code and message.

### Example

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://127.0.0.1:3000/api/records `
  -ContentType "application/json" `
  -Body '{"data":{"name":"Example","active":true}}'
```

## Storage

The server creates `data/records.json` the first time a request accesses record storage. This runtime data file is excluded from version control. Back up that file to preserve records.
