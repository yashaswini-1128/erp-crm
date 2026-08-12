import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function CustomerDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [customer, setCustomer] = useState<any>(null);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>(null);
  const canManage = user && ["ADMIN", "SALES"].includes(user.role);

  async function load() {
    const res = await api.get(`/customers/${id}`);
    setCustomer(res.data.data);
    setForm(res.data.data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function addFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    await api.post(`/customers/${id}/follow-ups`, { note });
    setNote("");
    load();
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    await api.put(`/customers/${id}`, {
      name: form.name,
      mobile: form.mobile,
      businessName: form.businessName,
      status: form.status,
      customerType: form.customerType,
      address: form.address,
    });
    setEditing(false);
    load();
  }

  if (!customer) return <div className="muted">Loading…</div>;

  return (
    <div>
      <Link to="/customers" className="muted" style={{ fontSize: 13 }}>
        ← Back to customers
      </Link>
      <div className="page-header" style={{ marginTop: 8 }}>
        <div>
          <div className="page-title">{customer.name}</div>
          <div className="page-sub">
            {customer.businessName || "Individual"} · {customer.mobile}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <span className={`pill pill-${customer.status.toLowerCase()}`}>{customer.status}</span>
          {canManage && (
            <button className="btn-outline btn-sm" onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="card">
          <b>Details</b>
          <div style={{ marginTop: 12, fontSize: 14, lineHeight: 2 }}>
            <div>
              <span className="muted">Type: </span>
              {customer.customerType}
            </div>
            <div>
              <span className="muted">Email: </span>
              {customer.email || "—"}
            </div>
            <div>
              <span className="muted">GST: </span>
              {customer.gstNumber || "—"}
            </div>
            <div>
              <span className="muted">Address: </span>
              {customer.address || "—"}
            </div>
            <div>
              <span className="muted">Notes: </span>
              {customer.notes || "—"}
            </div>
          </div>

          {customer.challans?.length > 0 && (
            <>
              <b style={{ display: "block", marginTop: 20 }}>Recent Challans</b>
              <table style={{ marginTop: 8 }}>
                <tbody>
                  {customer.challans.map((c: any) => (
                    <tr key={c.id}>
                      <td>{c.challanNumber}</td>
                      <td>
                        <span className={`pill pill-${c.status.toLowerCase()}`}>{c.status}</span>
                      </td>
                      <td className="muted">{new Date(c.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        <div className="card">
          <b>Follow-ups</b>
          {canManage && (
            <form onSubmit={addFollowUp} style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <input placeholder="Log a follow-up note…" value={note} onChange={(e) => setNote(e.target.value)} />
              <button className="btn-primary btn-sm" type="submit">
                Add
              </button>
            </form>
          )}
          <div style={{ marginTop: 16 }}>
            {customer.followUps?.length === 0 && <div className="muted" style={{ fontSize: 13 }}>No follow-ups logged yet.</div>}
            {customer.followUps?.map((f: any) => (
              <div key={f.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                <div style={{ fontSize: 14 }}>{f.note}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  {f.createdBy?.name} · {new Date(f.followUpAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Edit Customer</div>
            <form onSubmit={saveEdit}>
              <div className="field">
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="field">
                <label>Mobile</label>
                <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
              </div>
              <div className="field">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="LEAD">Lead</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn-outline" onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
