import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

interface Line {
  productId: string;
  quantity: string;
}

export default function ChallanNew() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState<Line[]>([{ productId: "", quantity: "1" }]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/customers?limit=100").then((r) => setCustomers(r.data.data));
    api.get("/products?limit=100").then((r) => setProducts(r.data.data));
  }, []);

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((ls) => [...ls, { productId: "", quantity: "1" }]);
  }
  function removeLine(idx: number) {
    setLines((ls) => ls.filter((_, i) => i !== idx));
  }

  function productPrice(id: string) {
    return products.find((p) => p.id === id)?.unitPrice || 0;
  }

  const total = lines.reduce((sum, l) => sum + Number(productPrice(l.productId)) * Number(l.quantity || 0), 0);

  async function submit(status: "DRAFT" | "CONFIRMED") {
    setError("");
    if (!customerId) return setError("Select a customer");
    const validLines = lines.filter((l) => l.productId && Number(l.quantity) > 0);
    if (validLines.length === 0) return setError("Add at least one product line");

    setSubmitting(true);
    try {
      const res = await api.post("/challans", {
        customerId,
        status,
        items: validLines.map((l) => ({ productId: l.productId, quantity: Number(l.quantity) })),
      });
      navigate(`/challans/${res.data.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create challan");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">New Sales Challan</div>
          <div className="page-sub">Confirming will deduct stock immediately — it can never go negative.</div>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="card">
        <div className="field">
          <label>Customer *</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.businessName ? `(${c.businessName})` : ""}
              </option>
            ))}
          </select>
        </div>

        <label>Products</label>
        <div className="line-items">
          {lines.map((l, idx) => {
            const prod = products.find((p) => p.id === l.productId);
            return (
              <div className="line-item-row" key={idx}>
                <select value={l.productId} onChange={(e) => updateLine(idx, { productId: e.target.value })}>
                  <option value="">Select product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — stock: {p.currentStock}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  placeholder="Qty"
                  value={l.quantity}
                  onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                />
                <div className="muted right">{prod ? `₹${(Number(prod.unitPrice) * Number(l.quantity || 0)).toFixed(2)}` : "—"}</div>
                <button type="button" className="btn-ghost btn-sm" onClick={() => removeLine(idx)}>
                  ✕
                </button>
              </div>
            );
          })}
        </div>
        <button type="button" className="btn-outline btn-sm" onClick={addLine}>
          + Add product line
        </button>

        <div className="right" style={{ marginTop: 18, fontSize: 16, fontWeight: 700 }}>
          Total: ₹{total.toFixed(2)}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button className="btn-outline" disabled={submitting} onClick={() => submit("DRAFT")}>
            Save as Draft
          </button>
          <button className="btn-primary" disabled={submitting} onClick={() => submit("CONFIRMED")}>
            Confirm & Deduct Stock
          </button>
        </div>
      </div>
    </div>
  );
}
