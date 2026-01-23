import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useLanguage } from "../context/LanguageContext";

const SupplierList = () => {
  const { t } = useLanguage();
  const [suppliers, setSuppliers] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(
        `/suppliers?page=${pagination.currentPage}&limit=10&sortBy=${sortBy}&order=${sortOrder}&search=${search}`,
      );
      if (response.data.suppliers) {
        setSuppliers(response.data.suppliers);
        setPagination((prev) => ({
          ...prev,
          totalPages: response.data.totalPages,
          totalItems: response.data.totalItems,
        }));
      } else {
        setSuppliers(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setError(t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.currentPage, sortBy, sortOrder, search]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field)
      return (
        <span
          style={{
            marginLeft: "0.25rem",
            color: "#94a3b8",
            fontSize: "0.8rem",
          }}
        >
          ↕
        </span>
      );
    return sortOrder === "asc" ? (
      <span
        style={{ marginLeft: "0.25rem", color: "#6366f1", fontSize: "0.8rem" }}
      >
        ↑
      </span>
    ) : (
      <span
        style={{ marginLeft: "0.25rem", color: "#6366f1", fontSize: "0.8rem" }}
      >
        ↓
      </span>
    );
  };

  const handleDelete = async (id) => {
    if (window.confirm(t("confirmDeleteSupplier"))) {
      try {
        await api.delete(`/suppliers/${id}`);
        fetchSuppliers();
      } catch (err) {
        console.error("Error deleting supplier:", err);
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
              {t("loading")}
            </span>
          ) : error ? (
            <span style={{ fontSize: "0.9rem", color: "var(--color-danger)" }}>
              {error}
            </span>
          ) : (
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>
              {t("suppliers")}
            </h2>
          )}
        </div>
        <div className="flex gap-2">
          <Link to="/suppliers/new" className="btn btn-primary">
            + {t("new")}
          </Link>
        </div>
      </div>

      <div
        className="flex justify-between items-center"
        style={{
          marginBottom: "1rem",
          color: "var(--color-text-secondary)",
          fontSize: "0.9rem",
        }}
      >
        <div className="flex gap-4">
          <input
            type="text"
            placeholder={t("searchPlaceholderSupplier")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((prev) => ({ ...prev, currentPage: 1 }));
            }}
            style={{
              padding: "0.5rem",
              border: "1px solid var(--color-border)",
              borderRadius: "4px",
              fontSize: "0.9rem",
              width: "250px",
            }}
          />
        </div>
      </div>
      {/* Main Table Card */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "var(--shadow-sm)",
          overflowX: "auto",
        }}
      >
        <table
          className="responsive-table"
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--color-border)",
                backgroundColor: "white",
              }}
            >
              <th
                onClick={() => handleSort("supplierNumber")}
                style={{
                  padding: "1rem",
                  textAlign: "left",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "#64748b",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <div className="flex items-center">
                  {t("supplierNumber")} <SortIcon field="supplierNumber" />
                </div>
              </th>
              <th
                onClick={() => handleSort("name")}
                style={{
                  padding: "1rem",
                  textAlign: "left",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "#64748b",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <div className="flex items-center">
                  {t("name")} <SortIcon field="name" />
                </div>
              </th>
              <th
                onClick={() => handleSort("nif")}
                style={{
                  padding: "1rem",
                  textAlign: "left",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "#64748b",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <div className="flex items-center">
                  {t("clientNIF")} <SortIcon field="nif" />
                </div>
              </th>
              <th
                onClick={() => handleSort("email")}
                style={{
                  padding: "1rem",
                  textAlign: "left",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "#64748b",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <div className="flex items-center">
                  {t("email")} <SortIcon field="email" />
                </div>
              </th>
              <th
                onClick={() => handleSort("phone")}
                style={{
                  padding: "1rem",
                  textAlign: "left",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "#64748b",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <div className="flex items-center">
                  {t("phone")} <SortIcon field="phone" />
                </div>
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
                {t("address")}
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
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {t("noSuppliers")}
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr
                  key={supplier._id}
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                  className="hover:bg-gray-50"
                >
                  <td
                    style={{
                      padding: "1rem",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                    }}
                    data-label={t("supplierNumber")}
                  >
                    {supplier.supplierNumber
                      ? supplier.supplierNumber.toString().padStart(5, "0")
                      : "-"}
                  </td>
                  <td
                    style={{ padding: "1rem", fontSize: "0.9rem" }}
                    data-label={t("name")}
                  >
                    {supplier.name}
                  </td>
                  <td
                    style={{ padding: "1rem", fontSize: "0.9rem" }}
                    data-label={t("clientNIF")}
                  >
                    {supplier.nif}
                  </td>
                  <td
                    style={{ padding: "1rem", fontSize: "0.9rem" }}
                    data-label={t("email")}
                  >
                    {supplier.email || "-"}
                  </td>
                  <td
                    style={{ padding: "1rem", fontSize: "0.9rem" }}
                    data-label={t("phone")}
                  >
                    {supplier.phone || "-"}
                  </td>
                  <td
                    style={{ padding: "1rem", fontSize: "0.9rem" }}
                    data-label={t("address")}
                  >
                    {[supplier.address, supplier.postalCode, supplier.city]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </td>
                  <td
                    style={{ padding: "1rem", textAlign: "right" }}
                    data-label={t("actions")}
                  >
                    <div className="flex gap-2 justify-end">
                      <Link
                        to={`/suppliers/edit/${supplier._id}`}
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
                        title={t("edit")}
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
                        onClick={() => handleDelete(supplier._id)}
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
                        title={t("delete")}
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
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div
        className="flex justify-between items-center"
        style={{ marginTop: "1rem", padding: "0 1rem" }}
      >
        <button
          onClick={() =>
            setPagination((prev) => ({
              ...prev,
              currentPage: Math.max(1, prev.currentPage - 1),
            }))
          }
          disabled={pagination.currentPage === 1}
          className="btn btn-secondary"
          style={{
            opacity: pagination.currentPage === 1 ? 0.5 : 1,
            pointerEvents: pagination.currentPage === 1 ? "none" : "auto",
          }}
        >
          {t("previous")}
        </button>
        <span
          style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}
        >
          {t("pageOf")
            .replace("{current}", pagination.currentPage)
            .replace("{total}", pagination.totalPages)}
        </span>
        <button
          onClick={() =>
            setPagination((prev) => ({
              ...prev,
              currentPage: Math.min(prev.totalPages, prev.currentPage + 1),
            }))
          }
          disabled={pagination.currentPage === pagination.totalPages}
          className="btn btn-secondary"
          style={{
            opacity: pagination.currentPage === pagination.totalPages ? 0.5 : 1,
            pointerEvents:
              pagination.currentPage === pagination.totalPages
                ? "none"
                : "auto",
          }}
        >
          {t("next")}
        </button>
      </div>
    </div>
  );
};

export default SupplierList;
