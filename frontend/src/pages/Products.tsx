import React, { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Product {
  id: string;
  name: string;
  sku: string;
  category?: string;
  unitPrice: string;
  currentStock: number;
  minStockAlert: number;
  location?: string;
}

const emptyForm = { name: "", sku: "", category: "", unitPrice: "", currentStock: "0", minStockAlert: "0", location: "" };

export default function Products() {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);
  const [adjustForm, setAdjustForm] = useState({ quantity: "", movementType: "IN", reason: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const canManageCatalog = user && ["ADMIN", "WAREHOUSE"].includes(user.role);

  async function load() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (lowStockOnly) params.set("lowStock", "true");
    const res = await api.get(`/products?${params.toString()}`);
    setItems(res.data.data);
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, lowStockOnly]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    try {
      await api.post("/products", {
        ...form,
        unitPrice: Number(form.unitPrice),
        currentStock: Number(form.currentStock),
        minStockAlert: Number(form.minStockAlert),
      });
      setShowAdd(false);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to create product");
    }
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    try {
      await api.post(`/products/${adjustTarget!.id}/stock-movements`, {
        quantity: Number(adjustForm.quantity),
        movementType: adjustForm.movementType,
        reason: adjustForm.reason,
      });
      setAdjustTarget(null);
      setAdjustForm({ quantity: "", movementType: "IN", reason: "" });
      load();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Stock adjustment failed");
    }
  }

  return (
    <div className="page-transition">
      <div className="page-header animate-slide-up">
        <div>
          <div className="page-title">Products & Inventory</div>
          <div className="page-sub">Catalog, pricing, and live stock levels.</div>
        </div>
        {canManageCatalog && (
          <button className="btn-primary animate-pop-in delay-100" onClick={() => setShowAdd(true)}>
            + Add Product
          </button>
        )}
      </div>

      <div className="toolbar animate-slide-up delay-100">
        <input placeholder="Search name or SKU…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500, fontSize: 14, color: "var(--ink)" }}>
          <input type="checkbox" style={{ width: "auto" }} checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
          Low stock only
        </label>
      </div>

      <div className="card animate-slide-up delay-200" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Location</th>
                {canManageCatalog && <th></th>}
              </tr>
            </thead>
            <tbody>
              {items.map((p, idx) => {
                const low = p.currentStock <= p.minStockAlert;
                return (
                  <tr key={p.id} className="animate-slide-right" style={{ animationDelay: `${idx * 50 + 300}ms` }}>
                    <td>{p.name}</td>
                    <td className="muted">{p.sku}</td>
                    <td className="muted">{p.category || "—"}</td>
                    <td>₹{Number(p.unitPrice).toFixed(2)}</td>
                    <td>
                      {p.currentStock}
                      {low && <span className="pill pill-inactive" style={{ marginLeft: 8 }}>LOW</span>}
                    </td>
                    <td className="muted">{p.location || "—"}</td>
                    {canManageCatalog && (
                      <td>
                        <button className="btn-outline btn-sm" onClick={() => setAdjustTarget(p)}>
                          Adjust Stock
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {items.length === 0 && <div className="empty-state animate-fade-in delay-300">No products found.</div>}
      </div>

      {showAdd && (
        <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Add Product</div>
            {errorMsg && <div className="error-box">{errorMsg}</div>}
            <form onSubmit={handleCreate}>
              <div className="grid-2">
                <div className="field">
                  <label>Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="field">
                  <label>SKU *</label>
                  <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Category</label>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
                <div className="field">
                  <label>Unit Price (₹) *</label>
                  <input required type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Opening Stock</label>
                  <input type="number" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} />
                </div>
                <div className="field">
                  <label>Min Stock Alert</label>
                  <input type="number" value={form.minStockAlert} onChange={(e) => setForm({ ...form, minStockAlert: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label>Location / Warehouse</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn-outline" onClick={() => setShowAdd(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {adjustTarget && (
        <div className="modal-backdrop" onClick={() => setAdjustTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Adjust Stock — {adjustTarget.name}</div>
            <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Current stock: {adjustTarget.currentStock}</div>
            {errorMsg && <div className="error-box">{errorMsg}</div>}
            <form onSubmit={handleAdjust}>
              <div className="grid-2">
                <div className="field">
                  <label>Movement Type</label>
                  <select value={adjustForm.movementType} onChange={(e) => setAdjustForm({ ...adjustForm, movementType: e.target.value })}>
                    <option value="IN">Stock IN</option>
                    <option value="OUT">Stock OUT</option>
                  </select>
                </div>
                <div className="field">
                  <label>Quantity *</label>
                  <input required type="number" min={1} value={adjustForm.quantity} onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label>Reason *</label>
                <input required placeholder="e.g. New purchase order received" value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn-outline" onClick={() => setAdjustTarget(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
