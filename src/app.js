import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { AppError } from "./errors.js";
import recordRoutes from "./record-routes.js";

export const app = express();

app.disable("x-powered-by");
app.use(
  cors({
    origin: config.corsOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/records", recordRoutes);

app.use((request, response, next) => {
  next(new AppError(404, "ROUTE_NOT_FOUND", "The requested route was not found."));
});

app.use((error, request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof AppError) {
    response.status(error.status).json({
      error: { code: error.code, message: error.message },
    });
    return;
  }

  if (error.type === "entity.parse.failed") {
    response.status(400).json({
      error: { code: "INVALID_JSON", message: "The request body contains invalid JSON." },
    });
    return;
  }

  if (error.type === "entity.too.large") {
    response.status(413).json({
      error: { code: "PAYLOAD_TOO_LARGE", message: "The request body exceeds the 1 MB limit." },
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected server error occurred." },
  });
});
