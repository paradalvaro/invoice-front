import { useState, useRef, useEffect } from "react";
import useAuth from "../hooks/useAuth";
import { useLanguage } from "../context/LanguageContext";

const Header = () => {
  const { logout, user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setShowDropdown(false);
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

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
          <span style={{ fontSize: "1.5rem" }}>♾️</span> Invoices
        </div>
        {/*<div style={{ marginLeft: "2rem", position: "relative" }}>
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
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
        </div> */}
      </div>

      <div className="flex items-center gap-4">
        {/* <button
          className="btn btn-primary"
          style={{ padding: "0.4rem 0.8rem" }}
        >
          +
        </button> */}

        <div style={{ position: "relative" }} ref={dropdownRef}>
          <div
            id="userPhoto"
            onClick={toggleDropdown}
            title={`${user?.name} ${user?.lastName}`}
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
              overflow: "hidden",
              backgroundSize: "cover",
              backgroundPosition: "center",
              cursor: "pointer",
              border: "2px solid transparent",
              transition: "border-color 0.2s",
              borderColor: showDropdown ? "white" : "transparent",
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

          {showDropdown && (
            <div
              style={{
                position: "absolute",
                top: "120%",
                right: 0,
                backgroundColor: "white",
                color: "var(--color-text-main)",
                borderRadius: "0.5rem",
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                width: "200px",
                overflow: "hidden",
                zIndex: 100,
                border: "1px solid var(--color-border)",
              }}
            >
              <div
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <p style={{ margin: 0, fontWeight: "600", fontSize: "0.9rem" }}>
                  {user?.name} {user?.lastName}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.8rem",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  @{user?.username}
                </p>
              </div>

              <div style={{ padding: "0.5rem 0" }}>
                {/* Language Selector */}
                <div
                  style={{
                    padding: "0.5rem 1rem",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {t("language")}
                </div>
                <button
                  onClick={() => handleLanguageChange("es")}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.5rem 1rem",
                    background: language === "es" ? "#f1f5f9" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    color:
                      language === "es" ? "var(--color-primary)" : "inherit",
                  }}
                >
                  🇪🇸 {t("spanish")}
                </button>
                <button
                  onClick={() => handleLanguageChange("en")}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.5rem 1rem",
                    background: language === "en" ? "#f1f5f9" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    color:
                      language === "en" ? "var(--color-primary)" : "inherit",
                  }}
                >
                  🇺🇸 {t("english")}
                </button>

                <div
                  style={{
                    height: "1px",
                    backgroundColor: "var(--color-border)",
                    margin: "0.5rem 0",
                  }}
                ></div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.5rem 1rem",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    color: "var(--color-danger)",
                  }}
                >
                  <span>🚪</span> {t("logout")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
