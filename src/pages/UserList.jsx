import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/auth/users");
      setUsers(response.data);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
      try {
        await api.delete(`/auth/users/${id}`);
        setUsers(users.filter((user) => user._id !== id));
      } catch (err) {
        console.error("Error deleting user:", err);
        alert("Error al eliminar usuario");
      }
    }
  };

  return (
    <div>
      {/* Page Header Area */}
      <div
        className="flex justify-between items-center"
        style={{ marginBottom: "1.5rem" }}
      >
        <div className="flex items-center gap-2">
          {isLoading ? (
            <span
              style={{
                fontSize: "0.9rem",
                color: "var(--color-text-secondary)",
              }}
            >
              Loading...
            </span>
          ) : error ? (
            <span style={{ fontSize: "0.9rem", color: "var(--color-danger)" }}>
              {error}
            </span>
          ) : (
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>
              Todos los usuarios
            </h2>
          )}
          <span style={{ color: "var(--color-primary)", cursor: "pointer" }}>
            ⌄
          </span>
        </div>
        <div className="flex gap-2">
          <Link to="/users/new" className="btn btn-primary">
            + Nuevo
          </Link>
          <button className="btn btn-secondary" style={{ padding: "0.5rem" }}>
            ...
          </button>
        </div>
      </div>

      {/* Filter/Action Bar Pattern */}
      <div
        className="flex justify-between items-center"
        style={{
          marginBottom: "1rem",
          color: "var(--color-text-secondary)",
          fontSize: "0.9rem",
        }}
      >
        <div className="flex gap-4">{/* Visual filters if needed */}</div>
        <div>{/* Search icon or filter icon usually here */}</div>
      </div>

      {/* Main Table Card */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--color-border)",
                backgroundColor: "white",
              }}
            >
              <th
                style={{
                  padding: "1rem",
                  textAlign: "left",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "#64748b",
                  textTransform: "uppercase",
                }}
              >
                Nombre
              </th>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "left",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "#64748b",
                  textTransform: "uppercase",
                }}
              >
                Apellido
              </th>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "left",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "#64748b",
                  textTransform: "uppercase",
                }}
              >
                Usuario
              </th>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "left",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "#64748b",
                  textTransform: "uppercase",
                }}
              >
                Tipo
              </th>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "right",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "#64748b",
                  textTransform: "uppercase",
                }}
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  No hay usuarios registrados.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user._id}
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                  className="hover:bg-gray-50"
                >
                  <td style={{ padding: "1rem", fontSize: "0.9rem" }}>
                    {user.name}
                  </td>
                  <td style={{ padding: "1rem", fontSize: "0.9rem" }}>
                    {user.lastName}
                  </td>
                  <td style={{ padding: "1rem", fontSize: "0.9rem" }}>
                    {user.username}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        backgroundColor:
                          user.type === "Admin" || user.type === "SuperAdmin"
                            ? "#dbeafe"
                            : "#f3f4f6",
                        color:
                          user.type === "Admin" || user.type === "SuperAdmin"
                            ? "#1e40af"
                            : "#4b5563",
                        fontWeight: "600",
                        textTransform: "uppercase",
                      }}
                    >
                      {user.type}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <div className="flex gap-2 justify-end">
                      {(currentUser?.type === "Admin" ||
                        currentUser?.type === "SuperAdmin") && (
                        <>
                          <Link
                            to={`/users/${user._id}/edit`}
                            style={{
                              padding: "0.5rem",
                              fontSize: "0.8rem",
                              backgroundColor: "var(--color-sidebar-bg)",
                              border: "1px solid var(--color-border)",
                              color: "var(--color-text-secondary)",
                              borderRadius: "4px",
                              textDecoration: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title="Editar"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              fill="currentColor"
                              viewBox="0 0 16 16"
                            >
                              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                            </svg>
                          </Link>

                          <button
                            onClick={() => handleDelete(user._id)}
                            style={{
                              padding: "0.5rem",
                              fontSize: "0.8rem",
                              backgroundColor: "#fee2e2",
                              color: "#ef4444",
                              borderRadius: "4px",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title="Eliminar"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              fill="currentColor"
                              viewBox="0 0 16 16"
                            >
                              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                              <path
                                fillRule="evenodd"
                                d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                              />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;
