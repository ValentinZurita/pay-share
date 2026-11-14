import { connection } from "next/server";
import { getAllSnapshots } from "@/lib/db";
import { respond } from "@/lib/http";

export async function GET() {
  await connection();
  try {
    const snapshots = await getAllSnapshots();
    return Response.json(snapshots, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return respond(error);
  }
}
