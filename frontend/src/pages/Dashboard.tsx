import React, { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const chartData = [
  { name: "Mon", challans: 4, customers: 2 },
  { name: "Tue", challans: 3, customers: 1 },
  { name: "Wed", challans: 7, customers: 4 },
  { name: "Thu", challans: 5, customers: 2 },
  { name: "Fri", challans: 8, customers: 5 },
  { name: "Sat", challans: 2, customers: 1 },
  { name: "Sun", challans: 4, customers: 3 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ customers: 0, products: 0, lowStock: 0, draftChallans: 0, confirmedChallans: 0 });

  useEffect(() => {
    async function load() {
      const [customers, products, lowStock, draft, confirmed] = await Promise.all([
        api.get("/customers?limit=1"),
        api.get("/products?limit=1"),
        api.get("/products?lowStock=true&limit=100"),
        api.get("/challans?status=DRAFT&limit=1"),
        api.get("/challans?status=CONFIRMED&limit=1"),
      ]);
      setStats({
        customers: customers.data.pagination.total,
        products: products.data.pagination.total,
        lowStock: lowStock.data.data.length,
        draftChallans: draft.data.pagination.total,
        confirmedChallans: confirmed.data.pagination.total,
      });
    }
    load();
  }, []);

  return (
    <div className="page-transition">
      <div className="page-header animate-slide-up">
        <div>
          <div className="page-title">Welcome back, {user?.name.split(" ")[0]} 👋</div>
          <div className="page-sub">Here's what's happening across the operation today.</div>
        </div>
      </div>

      <div className="grid-3">
        <div className="card stat-card animate-pop-in delay-100">
          <div className="stat-label">Customers</div>
          <div className="stat-value">{stats.customers}</div>
        </div>
        <div className="card stat-card animate-pop-in delay-200">
          <div className="stat-label">Active Products</div>
          <div className="stat-value">{stats.products}</div>
          {stats.lowStock > 0 && <div className="stat-flag">⚠️ {stats.lowStock} below min stock</div>}
        </div>
        <div className="card stat-card animate-pop-in delay-300">
          <div className="stat-label">Challans</div>
          <div className="stat-value">{stats.draftChallans + stats.confirmedChallans}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 6, fontWeight: 500 }}>
            <span style={{ color: "var(--accent)" }}>{stats.draftChallans}</span> draft · <span style={{ color: "var(--teal)" }}>{stats.confirmedChallans}</span> confirmed
          </div>
        </div>
      </div>

      <div className="card animate-slide-up delay-400" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
          <span>📈</span> Weekly Activity (Demo)
        </div>
        <div style={{ height: 300, width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorChallans" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--teal)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--teal)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
              <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-sm)" }}
                itemStyle={{ color: "var(--ink)" }}
              />
              <Area type="monotone" dataKey="challans" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorChallans)" />
              <Area type="monotone" dataKey="customers" stroke="var(--teal)" strokeWidth={3} fillOpacity={1} fill="url(#colorCustomers)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card animate-slide-up delay-500" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
          <span>💡</span> Quick Guide
        </div>
        <ul style={{ margin: 0, paddingLeft: 20, color: "var(--muted)", fontSize: 14, lineHeight: 1.9, fontWeight: 500 }}>
          <li><b>Sales:</b> add customers, log follow-ups, raise challans from Products stock.</li>
          <li><b>Warehouse:</b> manage the product catalog and adjust stock manually.</li>
          <li>Confirming a challan reduces stock immediately and cannot go negative.</li>
          <li>Cancelling a confirmed challan automatically restores stock.</li>
        </ul>
      </div>
    </div>
  );
}
