function parseAllowedOrigins(value) {
  if (!value || value.trim() === "*") {
    return "*";
  }

  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    throw new Error("CORS_ORIGIN must contain at least one origin or '*'.");
  }

  return origins;
}

export const config = {
  host: process.env.HOST || "127.0.0.1",
  port: Number(process.env.PORT || "3000"),
  corsOrigins: parseAllowedOrigins(process.env.CORS_ORIGIN),
};

if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}
