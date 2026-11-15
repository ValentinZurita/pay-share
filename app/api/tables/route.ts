import { connection } from "next/server";
import { createTable, getAllSnapshots } from "@/lib/db";
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

export async function POST() {
  await connection();
  try {
    const snapshot = await createTable();
    return Response.json(snapshot, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return respond(error);
  }
}
