import { openBill } from "@/lib/db";
import { isRecord, jsonError, readJson, respond } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    if (!isRecord(body)) return jsonError("La solicitud no es válida.", 400);
    const { tableId, totalCents } = body;
    if (typeof tableId !== "number" || typeof totalCents !== "number") {
      return jsonError("La solicitud no es válida.", 400);
    }
    const snapshot = await openBill(tableId, totalCents);
    return Response.json(snapshot, { status: 201 });
  } catch (error) {
    return respond(error);
  }
}
