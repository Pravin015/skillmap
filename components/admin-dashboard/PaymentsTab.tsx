"use client";
import { useEffect, useState } from "react";

const syne = "font-[family-name:var(--font-syne)]";

interface Payment {
  id: string; userName: string; userEmail: string; amount: number;
  currency: string; status: string; plan: string; description: string | null;
  razorpayPaymentId: string | null; createdAt: string;
}

const statusColors: Record<string, string> = {
  CAPTURED: "#10b981", CREATED: "#f59e0b", AUTHORIZED: "#3b82f6", FAILED: "#ef4444", REFUNDED: "#8b5cf6",
};

export default function PaymentsTab() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/admin/payments").then((r) => r.json()).then((d) => { setPayments(d.payments || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL" ? payments : payments.filter((p) => p.status === filter);
  const totalRevenue = payments.filter((p) => p.status === "CAPTURED").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === "CREATED" || p.status === "AUTHORIZED").reduce((s, p) => s + p.amount, 0);

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>Payments & Revenue</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{payments.length} total transactions</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Revenue", value: `₹${(totalRevenue / 100).toLocaleString()}`, color: "#10b981" },
          { label: "Pending", value: `₹${(totalPending / 100).toLocaleString()}`, color: "#f59e0b" },
          { label: "Transactions", value: payments.length, color: "#3b82f6" },
          { label: "Failed", value: payments.filter((p) => p.status === "FAILED").length, color: "#ef4444" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-white p-4" style={{ borderColor: "var(--border)" }}>
            <div className={`${syne} text-xl font-bold`} style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px]" style={{ color: "var(--muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {["ALL", "CAPTURED", "CREATED", "AUTHORIZED", "FAILED", "REFUNDED"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className="rounded-full px-3 py-1.5 text-[10px] font-medium border transition-all" style={{ background: filter === f ? "var(--ink)" : "white", color: filter === f ? "var(--accent)" : "var(--muted)", borderColor: filter === f ? "var(--ink)" : "var(--border)" }}>
            {f} ({f === "ALL" ? payments.length : payments.filter((p) => p.status === f).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--muted)" }}>No payments found</p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-[10px] font-medium" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Plan</th>
                  <th className="px-4 py-2 hidden sm:table-cell">Description</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="text-xs font-medium" style={{ color: "var(--ink)" }}>{p.userName}</div>
                      <div className="text-[10px]" style={{ color: "var(--muted)" }}>{p.userEmail}</div>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`${syne} text-sm font-bold`}>₹{(p.amount / 100).toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-2 text-xs" style={{ color: "var(--muted)" }}>{p.plan}</td>
                    <td className="px-4 py-2 text-[10px] hidden sm:table-cell" style={{ color: "var(--muted)" }}>{p.description || "—"}</td>
                    <td className="px-4 py-2">
                      <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: `${statusColors[p.status] || "#6b7280"}15`, color: statusColors[p.status] || "#6b7280" }}>{p.status}</span>
                    </td>
                    <td className="px-4 py-2 text-[10px] hidden md:table-cell" style={{ color: "var(--muted)" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
