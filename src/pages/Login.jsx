import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate("/invoices");
    } catch (err) {
      // console.error(err);
      setError("Invalid credentials");
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
          Books
        </h1>
      </div>

      <h2
        style={{
          fontSize: "1.25rem",
          marginBottom: "1.5rem",
          color: "var(--color-text-main)",
        }}
      >
        Iniciar Sesión
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
            Usuario
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
            placeholder="Introduce tu usuario"
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
            Contraseña
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
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%", padding: "0.75rem", fontSize: "1rem" }}
        >
          Entrar
        </button>
      </form>
      <div
        style={{
          marginTop: "1.5rem",
          fontSize: "0.875rem",
          color: "var(--color-text-secondary)",
        }}
      >
        ¿No tienes cuenta?{" "}
        <Link
          to="/register"
          style={{ color: "var(--color-primary)", fontWeight: "500" }}
        >
          Regístrate
        </Link>
      </div>
    </div>
  );
};

export default Login;
