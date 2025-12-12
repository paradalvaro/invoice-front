import useAuth from "../hooks/useAuth";

const Header = () => {
  const { logout, user } = useAuth();
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

  return (
    <header
      style={{
        height: "60px",
        backgroundColor: "var(--color-header-bg)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div className="flex items-center gap-4">
        {/* ... existing code ... */}
        <div
          style={{
            fontWeight: "bold",
            fontSize: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>♾️</span> Books
        </div>
        <div style={{ marginLeft: "2rem", position: "relative" }}>
          <input
            type="text"
            placeholder="Buscar en Facturas (/)"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "4px",
              padding: "0.4rem 0.75rem",
              color: "white",
              width: "300px",
              fontSize: "0.9rem",
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          className="btn btn-primary"
          style={{ padding: "0.4rem 0.8rem" }}
        >
          +
        </button>
        <button
          onClick={logout}
          className="btn"
          style={{ color: "rgba(0,0,0,1)", padding: "0.4rem" }}
          title="Logout"
        >
          Logout
        </button>
        <div
          id="userPhoto"
          title={`${user.name} ${user.lastName}`}
          style={{
            width: "32px",
            height: "32px",
            backgroundColor: "#dc3545",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.8rem",
            fontWeight: "bold",
            overflow: "hidden", // Ensure image fits circle
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {user?.photoUrl ? (
            <img
              src={`${serverUrl}${user.photoUrl}`}
              alt="Profile"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            user?.username?.charAt(0).toUpperCase() || "👤"
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
