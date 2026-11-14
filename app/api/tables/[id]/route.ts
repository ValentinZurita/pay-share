import { connection } from "next/server";
import { getTableSnapshot } from "@/lib/db";
import { jsonError, respond } from "@/lib/http";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await connection();
  try {
    const { id } = await context.params;
    const tableId = Number(id);
    if (!Number.isInteger(tableId)) return jsonError("No encontramos esa mesa.", 404);
    const snapshot = await getTableSnapshot(tableId);
    if (!snapshot) return jsonError("No encontramos esa mesa.", 404);
    return Response.json(snapshot, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return respond(error);
  }
}
