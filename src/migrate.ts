import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SqliteDatabase } from "./online/database.js";

await new SqliteDatabase("./data.sqlite").execute(await fs.readFile(path.join(path.dirname(fileURLToPath(import.meta.url)), "../schema.sql"), "utf8"));
