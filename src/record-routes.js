import { Router } from "express";
import { AppError } from "./errors.js";
import { recordStore } from "./record-store.js";

const router = Router();

function requireData(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError(400, "INVALID_BODY", "The request body must be a JSON object.");
  }
  const { data } = body;
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new AppError(400, "INVALID_DATA", "'data' must be a JSON object.");
  }
  return data;
}

function parseIntegerQuery(value, name, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new AppError(400, "INVALID_QUERY", `'${name}' must be a non-negative integer.`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > maximum) {
    throw new AppError(
      400,
      "INVALID_QUERY",
      `'${name}' must be a non-negative integer no greater than ${maximum}.`,
    );
  }
  return parsed;
}

router.get("/", (request, response) => {
  const q = request.query.q;
  if (q !== undefined && typeof q !== "string") {
    throw new AppError(400, "INVALID_QUERY", "'q' must be a string.");
  }

  const limit = parseIntegerQuery(request.query.limit, "limit", 50, 100);
  if (limit < 1) {
    throw new AppError(400, "INVALID_QUERY", "'limit' must be between 1 and 100.");
  }
  const offset = parseIntegerQuery(request.query.offset, "offset", 0);
  response.json(recordStore.list({ q, limit, offset }));
});

router.post("/", (request, response) => {
  const record = recordStore.create(requireData(request.body));
  response
    .status(201)
    .location(`/api/records/${record.id}`)
    .json({ data: record });
});

router.get("/:id", (request, response) => {
  const record = recordStore.get(request.params.id);
  if (!record) {
    throw new AppError(404, "RECORD_NOT_FOUND", "The requested record was not found.");
  }
  response.json({ data: record });
});

router.put("/:id", (request, response) => {
  const record = recordStore.replace(request.params.id, requireData(request.body));
  if (!record) {
    throw new AppError(404, "RECORD_NOT_FOUND", "The requested record was not found.");
  }
  response.json({ data: record });
});

router.patch("/:id", (request, response) => {
  const record = recordStore.update(request.params.id, requireData(request.body));
  if (!record) {
    throw new AppError(404, "RECORD_NOT_FOUND", "The requested record was not found.");
  }
  response.json({ data: record });
});

router.delete("/:id", (request, response) => {
  if (!recordStore.delete(request.params.id)) {
    throw new AppError(404, "RECORD_NOT_FOUND", "The requested record was not found.");
  }
  response.status(204).end();
});

export default router;
