import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useLanguage } from "../context/LanguageContext";
import { useNotification } from "../context/NotificationContext";

const BudgetList = () => {
  const [budgets, setBudgets] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("budgetNumber");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const { t } = useLanguage();
  const { showNotification } = useNotification();

  const fetchBudgets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(
        `/budgets?page=${pagination.currentPage}&limit=10&sortBy=${sortBy}&order=${sortOrder}&search=${search}&searchField=${searchField}&status=${statusFilter}`
      );
      if (response.data.data) {
        setBudgets(response.data.data);
        setPagination((prev) => ({
          ...prev,
          totalPages: response.data.totalPages,
          totalItems: response.data.totalItems,
        }));
      } else {
        setBudgets(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error("Error fetching budgets:", err);
      setError(t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pagination.currentPage,
    sortBy,
    sortOrder,
    search,
    searchField,
    statusFilter,
  ]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleDelete = async (id) => {
    if (window.confirm(t("confirmDelete"))) {
      try {
        await api.delete(`/budgets/${id}`);
        fetchBudgets();
        showNotification(t("changesSaved"), "success");
      } catch (err) {
        console.error("Error deleting budget:", err);
        showNotification(t("error"), "error");
      }
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field)
      return <span style={{ marginLeft: "0.25rem", color: "#94a3b8" }}>↕</span>;
    return sortOrder === "asc" ? (
      <span style={{ marginLeft: "0.25rem", color: "#6366f1" }}>↑</span>
    ) : (
      <span style={{ marginLeft: "0.25rem", color: "#6366f1" }}>↓</span>
    );
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
              {t("allBudgets")}
            </h2>
          )}
        </div>
        <div className="flex gap-2">
          <Link to="/budgets/new" className="btn btn-primary">
            + {t("new")}
          </Link>
        </div>
      </div>

      {/* Filter Area */}
      <div
        style={{
          backgroundColor: "#f8fafc",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          border: "1px solid #e2e8f0",
        }}
      >
        <div className="flex gap-2 items-center">
          <select
            value={searchField}
            onChange={(e) => {
              setSearchField(e.target.value);
              setPagination((prev) => ({ ...prev, currentPage: 1 }));
            }}
            style={{
              padding: "0.5rem",
              border: "1px solid var(--color-border)",
              borderRadius: "4px",
              fontSize: "0.9rem",
              backgroundColor: "white",
            }}
          >
            <option value="budgetNumber">{t("budgetNumber")}</option>
            <option value="status">{t("status")}</option>
          </select>

          <input
            type="text"
            placeholder={t("searchPlaceholder") || "Search..."}
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
              minWidth: "200px",
            }}
          />
        </div>

        <div className="flex gap-2 items-center">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((prev) => ({ ...prev, currentPage: 1 }));
            }}
            style={{
              padding: "0.5rem",
              border: "1px solid var(--color-border)",
              borderRadius: "4px",
              fontSize: "0.9rem",
              backgroundColor: "white",
              minWidth: "150px",
            }}
          >
            <option value="">{t("status")}</option>
            <option value="Draft">{t("statusDraft")}</option>
            <option value="Done">{t("statusDone")}</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
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
                onClick={() => handleSort("budgetNumber")}
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
                  {t("budgetNumber")} <SortIcon field="budgetNumber" />
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
                {t("client")}
              </th>
              <th
                onClick={() => handleSort("date")}
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
                  {t("date")} <SortIcon field="date" />
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
                {t("status")}
              </th>
              <th
                onClick={() => handleSort("totalAmount")}
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
                <div className="flex items-center justify-end">
                  {t("totalAmount")} <SortIcon field="totalAmount" />
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
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan="6"
                  style={{ padding: "2rem", textAlign: "center" }}
                >
                  {t("loading")}
                </td>
              </tr>
            ) : budgets.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  style={{ padding: "2rem", textAlign: "center" }}
                >
                  {t("noBudgets")}
                </td>
              </tr>
            ) : (
              budgets.map((budget) => (
                <tr
                  key={budget._id}
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                  className="hover:bg-gray-50"
                >
                  <td
                    style={{
                      padding: "1rem",
                      fontSize: "0.9rem",
                      textAlign: "center",
                    }}
                    data-label={t("budgetNumber")}
                  >
                    <Link
                      to={`/budgets/${budget._id}/edit`}
                      style={{
                        color: "var(--color-primary)",
                        fontWeight: "500",
                      }}
                    >
                      {budget.budgetNumber}
                    </Link>
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                    }}
                    data-label={t("client")}
                  >
                    {budget.client?.name || "-"}
                  </td>
                  <td
                    style={{ padding: "1rem", fontSize: "0.9rem" }}
                    data-label={t("date")}
                  >
                    {budget.date
                      ? new Date(budget.date).toLocaleDateString("es-ES", {
                          timeZone: "Europe/Madrid",
                        })
                      : "-"}
                  </td>
                  <td style={{ padding: "1rem" }} data-label={t("status")}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        backgroundColor:
                          budget.status === "Done" ? "#dcfce7" : "#f3f4f6",
                        color: budget.status === "Done" ? "#166534" : "#64748b",
                        fontWeight: "600",
                        textTransform: "uppercase",
                      }}
                    >
                      {budget.status === "Done"
                        ? t("statusDone")
                        : t("statusDraft")}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      textAlign: "right",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                    }}
                    data-label={t("totalAmount")}
                  >
                    €{budget.totalAmount.toFixed(2)}
                  </td>
                  <td
                    style={{ padding: "1rem", textAlign: "right" }}
                    data-label={t("actions")}
                  >
                    <div className="flex gap-2 justify-end">
                      <Link
                        to={`/budgets/${budget._id}/edit`}
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
                        onClick={() => handleDelete(budget._id)}
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

      {/* Pagination (Simplified) */}
      <div
        style={{
          marginTop: "1rem",
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.5rem",
        }}
      >
        <button
          disabled={pagination.currentPage === 1}
          onClick={() =>
            setPagination((prev) => ({
              ...prev,
              currentPage: prev.currentPage - 1,
            }))
          }
          className="btn btn-secondary btn-sm"
        >
          {t("previous")}
        </button>
        <span style={{ alignSelf: "center", fontSize: "0.9rem" }}>
          {t("pageOf")
            .replace("{current}", pagination.currentPage)
            .replace("{total}", pagination.totalPages)}
        </span>
        <button
          disabled={pagination.currentPage === pagination.totalPages}
          onClick={() =>
            setPagination((prev) => ({
              ...prev,
              currentPage: prev.currentPage + 1,
            }))
          }
          className="btn btn-secondary btn-sm"
        >
          {t("next")}
        </button>
      </div>
    </div>
  );
};

export default BudgetList;
