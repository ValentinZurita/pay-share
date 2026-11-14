import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import { isProduction, supabaseServiceRoleKey, supabaseUrl } from "@/lib/env";
import { computeTotals } from "@/lib/totals";
import type { BillForPayment, PaymentMethod, PaymentRow, Snapshot, SnapshotPayment } from "@/lib/types";

type TableRow = { id: number; name: string };
type BillRow = {
  id: number;
  table_id: number;
  total_cents: number;
  status: "open" | "closed";
  created_at: string;
  closed_at: string | null;
};

type Memory = {
  tables: TableRow[];
  bills: BillRow[];
  payments: PaymentRow[];
  billSeq: number;
  paySeq: number;
};

const globalMemory = globalThis as typeof globalThis & { __payshareMemory?: Memory };

function memoryStore(): Memory {
  if (!globalMemory.__payshareMemory) {
    globalMemory.__payshareMemory = {
      tables: Array.from({ length: 6 }, (_, index) => ({ id: index + 1, name: `Mesa ${index + 1}` })),
      bills: [],
      payments: [],
      billSeq: 0,
      paySeq: 0,
    };
  }
  return globalMemory.__payshareMemory;
}

let cached: SupabaseClient | null = null;
let testClient: SupabaseClient | null = null;

/** Solo para pruebas: sustituye el cliente de Supabase. */
export function setTestClient(client: SupabaseClient | null): void {
  testClient = client;
}

export function resetMemoryForTests(): void {
  memoryStore().bills = [];
  memoryStore().payments = [];
  memoryStore().billSeq = 0;
  memoryStore().paySeq = 0;
}

export function isMemoryMode(): boolean {
  if (testClient) return false;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) return false;
  return !isProduction();
}

function server(): SupabaseClient {
  if (testClient) return testClient;
  if (isMemoryMode()) {
    throw new Error("El modo local no usa Supabase.");
  }
  if (!cached) {
    cached = createClient(supabaseUrl(), supabaseServiceRoleKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

function dbError(error: { message: string; code?: string } | null): void {
  if (!error) return;
  if (error.code === "23505") {
    throw new AppError(409, "Esta mesa ya tiene una cuenta abierta.");
  }
  console.error(error.message);
  throw new AppError(500, "No pudimos guardar los datos. Inténtalo de nuevo.");
}

function isExpired(payment: PaymentRow, now = Date.now()): boolean {
  return payment.status === "pending" && !!payment.expires_at && new Date(payment.expires_at).getTime() <= now;
}

function toPayment(payment: PaymentRow): SnapshotPayment {
  return {
    id: payment.id,
    name: payment.payer_name,
    amountCents: payment.amount_cents,
    tipCents: payment.tip_cents,
    method: payment.method,
    status: payment.status,
    expired: isExpired(payment),
    createdAt: payment.created_at,
    paidAt: payment.paid_at,
  };
}

function toSnapshot(table: TableRow, bill: BillRow | null, payments: PaymentRow[]): Snapshot {
  if (!bill || bill.status !== "open") {
    return { table: { id: table.id, name: table.name }, bill: null };
  }
  const totals = computeTotals(
    bill.total_cents,
    payments.map((payment) => ({
      amountCents: payment.amount_cents,
      tipCents: payment.tip_cents,
      status: payment.status,
    })),
  );
  const ordered = [...payments].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return {
    table: { id: table.id, name: table.name },
    bill: {
      id: bill.id,
      totalCents: bill.total_cents,
      status: "open",
      createdAt: bill.created_at,
      paidCents: totals.paidCents,
      tipsCents: totals.tipsCents,
      remainingCents: totals.remainingCents,
      overpaidCents: totals.overpaidCents,
      payments: ordered.map(toPayment),
    },
  };
}

function memoryTable(id: number): TableRow | null {
  return memoryStore().tables.find((table) => table.id === id) ?? null;
}

function memoryOpenBill(tableId: number): BillRow | null {
  return memoryStore().bills.find((bill) => bill.table_id === tableId && bill.status === "open") ?? null;
}

function memoryPayments(billId: number): PaymentRow[] {
  return memoryStore().payments.filter((payment) => payment.bill_id === billId);
}

export async function getTableSnapshot(id: number): Promise<Snapshot | null> {
  if (isMemoryMode()) {
    const table = memoryTable(id);
    if (!table) return null;
    const bill = memoryOpenBill(id);
    return toSnapshot(table, bill, bill ? memoryPayments(bill.id) : []);
  }

  const supabase = server();
  const tableResult = await supabase.from("tables").select("id, name").eq("id", id).maybeSingle();
  dbError(tableResult.error);
  const table = tableResult.data as TableRow | null;
  if (!table) return null;

  const billResult = await supabase
    .from("bills")
    .select("id, table_id, total_cents, status, created_at, closed_at")
    .eq("table_id", id)
    .eq("status", "open")
    .maybeSingle();
  dbError(billResult.error);
  const bill = billResult.data as BillRow | null;
  if (!bill) return toSnapshot(table, null, []);

  const paymentsResult = await supabase.from("payments").select("*").eq("bill_id", bill.id);
  dbError(paymentsResult.error);
  return toSnapshot(table, bill, (paymentsResult.data ?? []) as PaymentRow[]);
}

export async function getAllSnapshots(): Promise<Snapshot[]> {
  if (isMemoryMode()) {
    return memoryStore().tables.map((table) => {
      const bill = memoryOpenBill(table.id);
      return toSnapshot(table, bill, bill ? memoryPayments(bill.id) : []);
    });
  }

  const supabase = server();
  const tablesResult = await supabase.from("tables").select("id, name").order("id");
  dbError(tablesResult.error);
  const tables = (tablesResult.data ?? []) as TableRow[];

  const billsResult = await supabase
    .from("bills")
    .select("id, table_id, total_cents, status, created_at, closed_at")
    .eq("status", "open");
  dbError(billsResult.error);
  const bills = (billsResult.data ?? []) as BillRow[];
  const billIds = bills.map((bill) => bill.id);

  let payments: PaymentRow[] = [];
  if (billIds.length > 0) {
    const paymentsResult = await supabase.from("payments").select("*").in("bill_id", billIds);
    dbError(paymentsResult.error);
    payments = (paymentsResult.data ?? []) as PaymentRow[];
  }

  return tables.map((table) => {
    const bill = bills.find((item) => item.table_id === table.id) ?? null;
    const rows = bill ? payments.filter((payment) => payment.bill_id === bill.id) : [];
    return toSnapshot(table, bill, rows);
  });
}

export async function openBill(tableId: number, totalCents: number): Promise<Snapshot> {
  if (!Number.isInteger(tableId) || tableId <= 0) {
    throw new AppError(400, "La mesa no es válida.");
  }
  if (!Number.isInteger(totalCents) || totalCents <= 0) {
    throw new AppError(400, "Escribe el total, por ejemplo 500.");
  }

  if (isMemoryMode()) {
    const table = memoryTable(tableId);
    if (!table) throw new AppError(404, "No encontramos esa mesa.");
    if (memoryOpenBill(tableId)) throw new AppError(409, "Esta mesa ya tiene una cuenta abierta.");
    memoryStore().billSeq += 1;
    memoryStore().bills.push({
      id: memoryStore().billSeq,
      table_id: tableId,
      total_cents: totalCents,
      status: "open",
      created_at: new Date().toISOString(),
      closed_at: null,
    });
    const snapshot = await getTableSnapshot(tableId);
    if (!snapshot) throw new AppError(404, "No encontramos esa mesa.");
    return snapshot;
  }

  const supabase = server();
  const tableResult = await supabase.from("tables").select("id").eq("id", tableId).maybeSingle();
  dbError(tableResult.error);
  if (!tableResult.data) throw new AppError(404, "No encontramos esa mesa.");

  const inserted = await supabase
    .from("bills")
    .insert({ table_id: tableId, total_cents: totalCents, status: "open" })
    .select("id")
    .single();
  dbError(inserted.error);

  const snapshot = await getTableSnapshot(tableId);
  if (!snapshot) throw new AppError(404, "No encontramos esa mesa.");
  return snapshot;
}

export async function closeBill(billId: number): Promise<Snapshot> {
  if (isMemoryMode()) {
    const bill = memoryStore().bills.find((item) => item.id === billId);
    if (!bill) throw new AppError(404, "No encontramos esa cuenta.");
    if (bill.status === "open") {
      bill.status = "closed";
      bill.closed_at = new Date().toISOString();
    }
    const snapshot = await getTableSnapshot(bill.table_id);
    if (!snapshot) throw new AppError(404, "No encontramos esa mesa.");
    return snapshot;
  }

  const supabase = server();
  const existing = await supabase.from("bills").select("id, table_id, status").eq("id", billId).maybeSingle();
  dbError(existing.error);
  const bill = existing.data as { id: number; table_id: number; status: string } | null;
  if (!bill) throw new AppError(404, "No encontramos esa cuenta.");

  if (bill.status === "open") {
    const updated = await supabase
      .from("bills")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", billId)
      .eq("status", "open");
    dbError(updated.error);
  }

  const snapshot = await getTableSnapshot(bill.table_id);
  if (!snapshot) throw new AppError(404, "No encontramos esa mesa.");
  return snapshot;
}

export async function getBillContext(billId: number): Promise<BillForPayment | null> {
  if (isMemoryMode()) {
    const bill = memoryStore().bills.find((item) => item.id === billId);
    if (!bill) return null;
    const table = memoryTable(bill.table_id);
    if (!table) return null;
    const totals = computeTotals(
      bill.total_cents,
      memoryPayments(bill.id).map((payment) => ({
        amountCents: payment.amount_cents,
        tipCents: payment.tip_cents,
        status: payment.status,
      })),
    );
    return {
      id: bill.id,
      tableId: table.id,
      tableName: table.name,
      status: bill.status,
      totalCents: bill.total_cents,
      remainingCents: totals.remainingCents,
    };
  }

  const supabase = server();
  const billResult = await supabase
    .from("bills")
    .select("id, table_id, total_cents, status")
    .eq("id", billId)
    .maybeSingle();
  dbError(billResult.error);
  const bill = billResult.data as Pick<BillRow, "id" | "table_id" | "total_cents" | "status"> | null;
  if (!bill) return null;

  const tableResult = await supabase.from("tables").select("id, name").eq("id", bill.table_id).maybeSingle();
  dbError(tableResult.error);
  const table = tableResult.data as TableRow | null;
  if (!table) return null;

  const paymentsResult = await supabase
    .from("payments")
    .select("amount_cents, tip_cents, status")
    .eq("bill_id", bill.id);
  dbError(paymentsResult.error);
  const totals = computeTotals(
    bill.total_cents,
    ((paymentsResult.data ?? []) as Pick<PaymentRow, "amount_cents" | "tip_cents" | "status">[]).map((payment) => ({
      amountCents: payment.amount_cents,
      tipCents: payment.tip_cents,
      status: payment.status,
    })),
  );

  return {
    id: bill.id,
    tableId: table.id,
    tableName: table.name,
    status: bill.status,
    totalCents: bill.total_cents,
    remainingCents: totals.remainingCents,
  };
}

export async function createPendingPayment(input: {
  billId: number;
  amountCents: number;
  tipCents: number;
  chargedCents: number;
  payerName: string | null;
  method: PaymentMethod;
  expiresAt: string;
}): Promise<PaymentRow> {
  const row = {
    bill_id: input.billId,
    amount_cents: input.amountCents,
    tip_cents: input.tipCents,
    charged_cents: input.chargedCents,
    payer_name: input.payerName,
    method: input.method,
    status: "pending" as const,
    expires_at: input.expiresAt,
  };

  if (isMemoryMode()) {
    memoryStore().paySeq += 1;
    const payment: PaymentRow = {
      id: memoryStore().paySeq,
      ...row,
      pey_qr_id: null,
      pey_transaction_id: null,
      created_at: new Date().toISOString(),
      paid_at: null,
    };
    memoryStore().payments.push(payment);
    return payment;
  }

  const inserted = await server().from("payments").insert(row).select("*").single();
  dbError(inserted.error);
  return inserted.data as PaymentRow;
}

export async function attachProviderRefs(
  paymentId: number,
  refs: { qrId?: string | null; transactionId?: string | null },
): Promise<void> {
  const values: { pey_qr_id?: string; pey_transaction_id?: string } = {};
  if (refs.qrId) values.pey_qr_id = refs.qrId;
  if (refs.transactionId) values.pey_transaction_id = refs.transactionId;
  if (Object.keys(values).length === 0) return;

  if (isMemoryMode()) {
    const payment = memoryStore().payments.find((item) => item.id === paymentId);
    if (!payment) throw new AppError(404, "No encontramos ese pago.");
    if (values.pey_qr_id) payment.pey_qr_id = values.pey_qr_id;
    if (values.pey_transaction_id) payment.pey_transaction_id = values.pey_transaction_id;
    return;
  }

  const updated = await server().from("payments").update(values).eq("id", paymentId);
  dbError(updated.error);
}

export async function deletePendingPayment(paymentId: number): Promise<void> {
  if (isMemoryMode()) {
    memoryStore().payments = memoryStore().payments.filter((payment) => payment.id !== paymentId || payment.status !== "pending");
    return;
  }
  const deleted = await server().from("payments").delete().eq("id", paymentId).eq("status", "pending");
  dbError(deleted.error);
}

export async function getPayment(paymentId: number): Promise<PaymentRow | null> {
  if (isMemoryMode()) {
    return memoryStore().payments.find((payment) => payment.id === paymentId) ?? null;
  }
  const result = await server().from("payments").select("*").eq("id", paymentId).maybeSingle();
  dbError(result.error);
  return (result.data as PaymentRow | null) ?? null;
}

export async function findPaymentForWebhook(ref: {
  qrId?: string | null;
  transactionId?: string | null;
  paymentId?: number | null;
}): Promise<PaymentRow | null> {
  if (isMemoryMode()) {
    if (ref.qrId) {
      const byQr = memoryStore().payments.find((payment) => payment.pey_qr_id === ref.qrId);
      if (byQr) return byQr;
    }
    if (ref.transactionId) {
      const byTxn = memoryStore().payments.find((payment) => payment.pey_transaction_id === ref.transactionId);
      if (byTxn) return byTxn;
    }
    if (ref.paymentId) return memoryStore().payments.find((payment) => payment.id === ref.paymentId) ?? null;
    return null;
  }

  const supabase = server();
  if (ref.qrId) {
    const byQr = await supabase.from("payments").select("*").eq("pey_qr_id", ref.qrId).maybeSingle();
    dbError(byQr.error);
    if (byQr.data) return byQr.data as PaymentRow;
  }
  if (ref.transactionId) {
    const byTxn = await supabase.from("payments").select("*").eq("pey_transaction_id", ref.transactionId).maybeSingle();
    dbError(byTxn.error);
    if (byTxn.data) return byTxn.data as PaymentRow;
  }
  if (ref.paymentId) {
    const byId = await supabase.from("payments").select("*").eq("id", ref.paymentId).maybeSingle();
    dbError(byId.error);
    if (byId.data) return byId.data as PaymentRow;
  }
  return null;
}

/** Cambia la fila solo si sigue pendiente. Un aviso repetido no la toca. */
export async function markPaid(paymentId: number, transactionId: string): Promise<boolean> {
  const paidAt = new Date().toISOString();
  if (isMemoryMode()) {
    const payment = memoryStore().payments.find((item) => item.id === paymentId && item.status === "pending");
    if (!payment) return false;
    payment.status = "paid";
    payment.paid_at = paidAt;
    payment.pey_transaction_id = transactionId;
    return true;
  }

  const updated = await server()
    .from("payments")
    .update({ status: "paid", paid_at: paidAt, pey_transaction_id: transactionId })
    .eq("id", paymentId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  dbError(updated.error);
  return updated.data !== null;
}
