import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useLanguage } from "../context/LanguageContext";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);
      formData.append("name", name);
      formData.append("lastName", lastName);
      if (file) {
        formData.append("photo", file);
      }
      await register(formData);
      navigate("/invoices");
    } catch (err) {
      console.error(err);
      setError(t("error"));
    }
  };

  return (
    <div className="auth-container">
      <div
        style={{
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span style={{ fontSize: "2rem" }}>♾️</span>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            margin: 0,
            color: "var(--color-primary)",
          }}
        >
          Invoices
        </h1>
      </div>

      <h2
        style={{
          fontSize: "1.25rem",
          marginBottom: "1.5rem",
          color: "var(--color-text-main)",
        }}
      >
        {t("registerTitle")}
      </h2>

      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            color: "#ef4444",
            padding: "0.75rem",
            borderRadius: "0.375rem",
            marginBottom: "1rem",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
                fontSize: "0.875rem",
                color: "var(--color-text-secondary)",
              }}
            >
              {t("name")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.375rem",
                border: "1px solid #cbd5e1",
                fontSize: "1rem",
              }}
              placeholder="Juan"
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
                fontSize: "0.875rem",
                color: "var(--color-text-secondary)",
              }}
            >
              {t("lastName")}
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.375rem",
                border: "1px solid #cbd5e1",
                fontSize: "1rem",
              }}
              placeholder="Pérez"
            />
          </div>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {t("username")}
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "0.375rem",
              border: "1px solid #cbd5e1",
              fontSize: "1rem",
            }}
            placeholder={t("placeholderUsername")}
          />
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {t("password")}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "0.375rem",
              border: "1px solid #cbd5e1",
              fontSize: "1rem",
            }}
            placeholder={t("placeholderPassword")}
          />
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {t("photo")}
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            accept="image/*"
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "0.375rem",
              border: "1px solid #cbd5e1",
              fontSize: "1rem",
            }}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%", padding: "0.75rem", fontSize: "1rem" }}
        >
          {t("registerButton")}
        </button>
      </form>
      <div
        style={{
          marginTop: "1.5rem",
          fontSize: "0.875rem",
          color: "var(--color-text-secondary)",
        }}
      >
        {t("haveAccount")}{" "}
        <Link
          to="/login"
          style={{ color: "var(--color-primary)", fontWeight: "500" }}
        >
          {t("login")}
        </Link>
      </div>
    </div>
  );
};

export default Register;
