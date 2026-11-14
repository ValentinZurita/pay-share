import { closeBill } from "@/lib/db";
import { jsonError, respond } from "@/lib/http";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const billId = Number(id);
    if (!Number.isInteger(billId)) return jsonError("No encontramos esa cuenta.", 404);
    const snapshot = await closeBill(billId);
    return Response.json(snapshot);
  } catch (error) {
    return respond(error);
  }
}
