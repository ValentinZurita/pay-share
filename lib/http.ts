import { AppError } from "@/lib/errors";

export function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function respond(error: unknown): Response {
  if (error instanceof AppError) return jsonError(error.message, error.status);
  console.error(error);
  return jsonError("No pudimos completar la operación. Inténtalo de nuevo.", 500);
}
