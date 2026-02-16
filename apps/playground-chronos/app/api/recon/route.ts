import { readFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");

export async function GET() {
  const p = resolve(root, "generated/recon.json");
  if (!existsSync(p)) return Response.json({ error: "not found" }, { status: 404 });
  const content = await readFile(p, "utf-8");
  return new Response(content, {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
  });
}
