import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Customer {
  id: string;
  name: string;
  mobile: string;
  businessName?: string;
  customerType: string;
  status: string;
  followUpDate?: string;
}

const emptyForm = {
  name: "",
  mobile: "",
  email: "",
  businessName: "",
  gstNumber: "",
  customerType: "RETAIL",
  address: "",
  status: "LEAD",
  notes: "",
};

export default function Customers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [submitError, setSubmitError] = useState("");
  const canManage = user && ["ADMIN", "SALES"].includes(user.role);

  async function load() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const res = await api.get(`/customers?${params.toString()}`);
    setItems(res.data.data);
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    try {
      await api.post("/customers", { ...form, email: form.email || undefined });
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || "Failed to create customer");
    }
  }

  return (
    <div className="page-transition">
      <div className="page-header animate-slide-up">
        <div>
          <div className="page-title">Customers</div>
          <div className="page-sub">CRM — leads, active accounts, and follow-ups.</div>
        </div>
        {canManage && (
          <button className="btn-primary animate-pop-in delay-100" onClick={() => setShowModal(true)}>
            + Add Customer
          </button>
        )}
      </div>

      <div className="toolbar animate-slide-up delay-100">
        <input placeholder="Search name, mobile, business…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="card animate-slide-up delay-200" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Business</th>
                <th>Mobile</th>
                <th>Type</th>
                <th>Status</th>
                <th>Next Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c, idx) => (
                <tr key={c.id} className="clickable animate-slide-right" style={{ animationDelay: `${idx * 50 + 300}ms` }} onClick={() => navigate(`/customers/${c.id}`)}>
                  <td>{c.name}</td>
                  <td className="muted">{c.businessName || "—"}</td>
                  <td>{c.mobile}</td>
                  <td className="muted">{c.customerType}</td>
                  <td>
                    <span className={`pill pill-${c.status.toLowerCase()}`}>{c.status}</span>
                  </td>
                  <td className="muted">{c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 && <div className="empty-state animate-fade-in delay-300">No customers found.</div>}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Add Customer</div>
            {submitError && <div className="error-box">{submitError}</div>}
            <form onSubmit={handleCreate}>
              <div className="grid-2">
                <div className="field">
                  <label>Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="field">
                  <label>Mobile *</label>
                  <input required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="field">
                  <label>Business Name</label>
                  <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Customer Type</label>
                  <select value={form.customerType} onChange={(e) => setForm({ ...form, customerType: e.target.value })}>
                    <option value="RETAIL">Retail</option>
                    <option value="WHOLESALE">Wholesale</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                  </select>
                </div>
                <div className="field">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="LEAD">Lead</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>GST Number</label>
                <input value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
              </div>
              <div className="field">
                <label>Address</label>
                <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="field">
                <label>Notes</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
