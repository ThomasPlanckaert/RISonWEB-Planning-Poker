import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const required = ["index.js", "index.d.ts", "session.d.ts", "events.d.ts"];

for (const file of required) {
  const filePath = path.join(dist, file);
  if (!fs.existsSync(filePath)) {
    console.error(`@planning-poker/shared build missing: ${filePath}`);
    process.exit(1);
  }
}

console.log("@planning-poker/shared build OK");
