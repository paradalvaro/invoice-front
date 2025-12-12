import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { label: "Inicio", path: "/dashboard", icon: "🏠" },
    //{ label: "Artículos", path: "/items", icon: "🛍️" },
    { label: "Ventas", path: "/invoices", icon: "🛒" }, // Mapping Invoices to Ventas for now
    //{ label: "Clientes", path: "/clients", icon: "👥" },
    //{ label: "Estimaciones", path: "/estimates", icon: "📄" },
    { label: "Usuarios", path: "/users", icon: "👤" },
    // Add other items as visual placeholders if needed
  ];

  return (
    <aside
      style={{
        width: "240px",
        backgroundColor: "var(--color-sidebar-bg)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: "60px" /* Height of header */,
        height: "calc(100vh - 60px)",
      }}
    >
      <nav style={{ padding: "1rem" }}>
        <ul
          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.5rem",
                    color: isActive
                      ? "var(--color-primary)"
                      : "var(--color-text-secondary)",
                    backgroundColor: isActive
                      ? "var(--color-primary-bg)"
                      : "transparent",
                    textDecoration: "none",
                    fontWeight: isActive ? "600" : "500",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span style={{ fontSize: "1.25rem" }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
