import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dataFile = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "data",
  "records.json",
);

function ensureDataFile() {
  mkdirSync(dirname(dataFile), { recursive: true });
  try {
    readFileSync(dataFile, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
    writeFileSync(dataFile, "[]\n", { flag: "wx" });
  }
}

function readRecords() {
  ensureDataFile();
  let records;
  try {
    records = JSON.parse(readFileSync(dataFile, "utf8"));
  } catch (error) {
    throw new Error(`Could not read record storage at ${dataFile}: ${error.message}`);
  }
  if (!Array.isArray(records)) {
    throw new Error(`Record storage at ${dataFile} must contain a JSON array.`);
  }
  return records;
}

function writeRecords(records) {
  const temporaryFile = `${dataFile}.tmp`;
  writeFileSync(temporaryFile, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  renameSync(temporaryFile, dataFile);
}

function toPublicRecord(record) {
  return {
    id: record.id,
    data: { ...record.data },
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export const recordStore = {
  list({ q, limit, offset }) {
    const records = readRecords();
    const matching = q
      ? records.filter((record) =>
          JSON.stringify(record.data).toLowerCase().includes(q.toLowerCase()),
        )
      : records;

    return {
      data: matching.slice(offset, offset + limit).map(toPublicRecord),
      total: matching.length,
      limit,
      offset,
    };
  },

  get(id) {
    const record = readRecords().find((item) => item.id === id);
    return record ? toPublicRecord(record) : null;
  },

  create(data) {
    const records = readRecords();
    const now = new Date().toISOString();
    const record = {
      id: randomUUID(),
      data: { ...data },
      createdAt: now,
      updatedAt: now,
    };
    records.push(record);
    writeRecords(records);
    return toPublicRecord(record);
  },

  replace(id, data) {
    const records = readRecords();
    const index = records.findIndex((item) => item.id === id);
    if (index === -1) {
      return null;
    }

    const record = {
      ...records[index],
      data: { ...data },
      updatedAt: new Date().toISOString(),
    };
    records[index] = record;
    writeRecords(records);
    return toPublicRecord(record);
  },

  update(id, data) {
    const records = readRecords();
    const index = records.findIndex((item) => item.id === id);
    if (index === -1) {
      return null;
    }

    const record = {
      ...records[index],
      data: { ...records[index].data, ...data },
      updatedAt: new Date().toISOString(),
    };
    records[index] = record;
    writeRecords(records);
    return toPublicRecord(record);
  },

  delete(id) {
    const records = readRecords();
    const index = records.findIndex((item) => item.id === id);
    if (index === -1) {
      return false;
    }
    records.splice(index, 1);
    writeRecords(records);
    return true;
  },
};
