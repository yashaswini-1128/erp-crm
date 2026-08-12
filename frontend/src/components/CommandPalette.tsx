import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const actions = [
    { name: "Go to Dashboard", path: "/" },
    { name: "Go to Customers", path: "/customers" },
    { name: "Go to Products & Stock", path: "/products" },
    { name: "Go to Sales Challans", path: "/challans" },
    { name: "Create New Challan", path: "/challans/new" },
  ];

  const filtered = actions.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="modal-backdrop" onClick={() => setIsOpen(false)} style={{ alignItems: "flex-start", paddingTop: "15vh" }}>
      <div 
        className="modal" 
        style={{ padding: 0, overflow: "hidden", border: "1px solid var(--line)", background: "var(--card)" }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--line-light)" }}>
          <Search size={20} color="var(--muted)" style={{ marginRight: 12 }} />
          <input
            autoFocus
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", boxShadow: "none", padding: 0, fontSize: 16, background: "transparent" }}
          />
        </div>
        <div style={{ padding: "8px 0", maxHeight: "300px", overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "16px 20px", color: "var(--muted)", fontSize: 14 }}>No results found.</div>
          ) : (
            filtered.map((action, idx) => (
              <div
                key={idx}
                className="clickable"
                style={{ padding: "12px 20px", color: "var(--ink)", fontSize: 14, fontWeight: 500 }}
                onClick={() => {
                  navigate(action.path);
                  setIsOpen(false);
                  setSearch("");
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {action.name}
              </div>
            ))
          )}
        </div>
        <div style={{ padding: "8px 20px", background: "var(--paper)", borderTop: "1px solid var(--line-light)", fontSize: 12, color: "var(--muted)", display: "flex", justifyContent: "space-between" }}>
          <span>Search or jump to...</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  );
}
