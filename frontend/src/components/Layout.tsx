import React from "react";
import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CommandPalette from "./CommandPalette";

const NAV = [
  { to: "/", label: "Dashboard", roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"], icon: "📊" },
  { to: "/customers", label: "Customers (CRM)", roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"], icon: "👥" },
  { to: "/products", label: "Products & Stock", roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"], icon: "📦" },
  { to: "/challans", label: "Sales Challans", roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"], icon: "📄" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [theme, setTheme] = React.useState(() => localStorage.getItem("theme") || "light");

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <CommandPalette />
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">O</div>
          <div className="brand-name">Orbit ERP</div>
        </div>
        {NAV.filter((n) => n.roles.includes(user.role)).map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === "/"}
            className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
          >
            <span style={{ marginRight: 10, fontSize: 16 }}>{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
        <div className="sidebar-footer">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{user.name}</div>
          <span className="role-pill">{user.role}</span>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <button className="btn-ghost btn-sm" onClick={logout} style={{ color: "#94A3B8", paddingLeft: 0, paddingRight: 0 }}>
              Log out <span style={{ marginLeft: 6 }}>→</span>
            </button>
            <button 
              className="btn-ghost btn-sm" 
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              title="Toggle Theme"
              style={{ padding: 4 }}
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
          </div>
        </div>
      </aside>
      <main className="main">
        <div style={{ width: "100%", maxWidth: "1280px", margin: "0 auto" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
