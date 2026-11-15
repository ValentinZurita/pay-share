import { updateOpenBillTotal } from "@/lib/db";
import { isRecord, jsonError, readJson, respond } from "@/lib/http";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const billId = Number(id);
    if (!Number.isInteger(billId)) return jsonError("La cuenta no es válida.", 400);
    const body = await readJson(request);
    if (!isRecord(body) || typeof body.totalCents !== "number") {
      return jsonError("La solicitud no es válida.", 400);
    }
    const snapshot = await updateOpenBillTotal(billId, body.totalCents);
    return Response.json(snapshot);
  } catch (error) {
    return respond(error);
  }
}
