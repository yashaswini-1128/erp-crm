import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function ChallanDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [challan, setChallan] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const canAct = user && ["ADMIN", "SALES"].includes(user.role);

  async function load() {
    const res = await api.get(`/challans/${id}`);
    setChallan(res.data.data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function confirm() {
    setError("");
    setBusy(true);
    try {
      await api.patch(`/challans/${id}/confirm`);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to confirm challan");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setError("");
    setBusy(true);
    try {
      await api.patch(`/challans/${id}/cancel`);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to cancel challan");
    } finally {
      setBusy(false);
    }
  }

  async function downloadInvoice() {
    const res = await api.get(`/challans/${id}/invoice`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${challan.challanNumber}.pdf`;
    a.click();
  }

  if (!challan) return <div className="muted">Loading…</div>;

  return (
    <div>
      <Link to="/challans" className="muted" style={{ fontSize: 13 }}>
        ← Back to challans
      </Link>
      <div className="page-header" style={{ marginTop: 8 }}>
        <div>
          <div className="page-title">{challan.challanNumber}</div>
          <div className="page-sub">
            {challan.customer?.name} · created {new Date(challan.createdAt).toLocaleString()}
          </div>
        </div>
        <span className={`pill pill-${challan.status.toLowerCase()}`}>{challan.status}</span>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th className="right">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {challan.items.map((it: any) => (
              <tr key={it.id}>
                <td>{it.productNameSnap}</td>
                <td className="muted">{it.productSkuSnap}</td>
                <td>{it.quantity}</td>
                <td>₹{Number(it.unitPriceSnap).toFixed(2)}</td>
                <td className="right">₹{Number(it.lineTotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="right" style={{ marginTop: 14, fontSize: 16, fontWeight: 700 }}>
          Grand Total: ₹{challan.items.reduce((s: number, it: any) => s + Number(it.lineTotal), 0).toFixed(2)}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button className="btn-outline" onClick={downloadInvoice}>
            Download Invoice (PDF)
          </button>
          {canAct && challan.status === "DRAFT" && (
            <button className="btn-primary" disabled={busy} onClick={confirm}>
              Confirm & Deduct Stock
            </button>
          )}
          {canAct && challan.status !== "CANCELLED" && (
            <button className="btn-danger" disabled={busy} onClick={cancel}>
              Cancel Challan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
