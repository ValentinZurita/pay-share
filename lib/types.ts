export type PaymentMethod = "qr" | "pn";
export type PaymentStatus = "pending" | "paid";

export type SnapshotPayment = {
  id: number;
  name: string | null;
  amountCents: number;
  tipCents: number;
  method: PaymentMethod;
  status: PaymentStatus;
  expired: boolean;
  createdAt: string;
  paidAt: string | null;
};

export type Snapshot = {
  table: { id: number; name: string };
  bill: null | {
    id: number;
    totalCents: number;
    status: "open";
    createdAt: string;
    paidCents: number;
    tipsCents: number;
    remainingCents: number;
    overpaidCents: number;
    payments: SnapshotPayment[];
  };
};

export type PaymentRow = {
  id: number;
  bill_id: number;
  amount_cents: number;
  tip_cents: number;
  charged_cents: number;
  payer_name: string | null;
  method: PaymentMethod;
  status: PaymentStatus;
  pey_qr_id: string | null;
  pey_transaction_id: string | null;
  expires_at: string | null;
  created_at: string;
  paid_at: string | null;
};

export type BillForPayment = {
  id: number;
  tableId: number;
  tableName: string;
  status: "open" | "closed";
  totalCents: number;
  remainingCents: number;
};
