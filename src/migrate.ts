import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SqliteDatabase } from "./online/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await new SqliteDatabase().execute(await fs.readFile(path.join(__dirname, "../schema.sql"), "utf8"));
