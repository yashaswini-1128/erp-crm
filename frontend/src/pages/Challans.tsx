import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Challans() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const canCreate = user && ["ADMIN", "SALES"].includes(user.role);

  async function load() {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await api.get(`/challans?${params.toString()}`);
    setItems(res.data.data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="page-transition">
      <div className="page-header animate-slide-up">
        <div>
          <div className="page-title">Sales Challans</div>
          <div className="page-sub">Draft, confirm, and track stock-linked sales documents.</div>
        </div>
        {canCreate && (
          <button className="btn-primary animate-pop-in delay-100" onClick={() => navigate("/challans/new")}>
            + New Challan
          </button>
        )}
      </div>

      <div className="toolbar animate-slide-up delay-100">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="card animate-slide-up delay-200" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Challan No.</th>
                <th>Customer</th>
                <th>Qty</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c, idx) => (
                <tr key={c.id} className="clickable animate-slide-right" style={{ animationDelay: `${idx * 50 + 300}ms` }} onClick={() => navigate(`/challans/${c.id}`)}>
                  <td>{c.challanNumber}</td>
                  <td>{c.customer?.name}</td>
                  <td>{c.totalQuantity}</td>
                  <td>
                    <span className={`pill pill-${c.status.toLowerCase()}`}>{c.status}</span>
                  </td>
                  <td className="muted">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 && <div className="empty-state animate-fade-in delay-300">No challans found.</div>}
      </div>
    </div>
  );
}
