import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useLanguage } from "../context/LanguageContext";
import { useConfig } from "../context/ConfigContext";
import { useNotification } from "../context/NotificationContext";

const AlbaranList = () => {
  const [albaranes, setAlbaranes] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("AlbaranNumber");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const { t } = useLanguage();
  const { config } = useConfig();
  const { showNotification } = useNotification();

  const fetchAlbaranes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(
        `/albaranes?page=${pagination.currentPage}&limit=10&sortBy=${sortBy}&order=${sortOrder}&search=${search}&searchField=${searchField}&status=${statusFilter}`
      );
      if (response.data.data) {
        setAlbaranes(response.data.data);
        setPagination((prev) => ({
          ...prev,
          totalPages: response.data.totalPages,
          totalItems: response.data.totalItems,
        }));
      } else {
        setAlbaranes(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error("Error fetching albaranes:", err);
      setError(t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbaranes();
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

  const handleDownloadPDF = async (id, serie, number) => {
    try {
      showNotification(t("loading"), "info");
      const response = await api.get(`/albaranes/${id}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `albaran-${serie}${number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      showNotification(t("error"), "error");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t("confirmDelete"))) {
      try {
        await api.delete(`/albaranes/${id}`);
        fetchAlbaranes();
        showNotification(t("changesSaved"), "success");
      } catch (err) {
        console.error("Error deleting albaran:", err);
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
              {t("allAlbaranes")}
            </h2>
          )}
        </div>
        <div className="flex gap-2">
          <Link to="/albaranes/new" className="btn btn-primary">
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
            <option value="AlbaranNumber">{t("albaranNumber")}</option>
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
                onClick={() => handleSort("serie")}
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
                  {t("serie")} <SortIcon field="serie" />
                </div>
              </th>
              <th
                onClick={() => handleSort("AlbaranNumber")}
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
                  {t("albaranNumber")} <SortIcon field="AlbaranNumber" />
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
            {!isLoading && albaranes.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  style={{ padding: "2rem", textAlign: "center" }}
                >
                  {t("noAlbaranes")}
                </td>
              </tr>
            ) : (
              albaranes.map((albaran) => (
                <tr
                  key={albaran._id}
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                  className="hover:bg-gray-50"
                >
                  <td
                    style={{
                      padding: "1rem",
                      fontSize: "0.9rem",
                    }}
                    data-label={t("serie")}
                  >
                    {albaran.serie || "-"}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontSize: "0.9rem",
                      textAlign: "center",
                    }}
                    data-label={t("albaranNumber")}
                  >
                    <Link
                      to={`/albaranes/${albaran._id}/edit`}
                      style={{
                        color: "var(--color-primary)",
                        fontWeight: "500",
                      }}
                    >
                      {albaran.AlbaranNumber || "-"}
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
                    {albaran.client?.name || "-"}
                  </td>
                  <td
                    style={{ padding: "1rem", fontSize: "0.9rem" }}
                    data-label={t("date")}
                  >
                    {albaran.date
                      ? new Date(albaran.date).toLocaleDateString("es-ES", {
                          timeZone: config.timezone || "Europe/Madrid",
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
                          albaran.status === "Done" ? "#dcfce7" : "#f3f4f6",
                        color:
                          albaran.status === "Done" ? "#166534" : "#64748b",
                        fontWeight: "600",
                        textTransform: "uppercase",
                      }}
                    >
                      {albaran.status === "Done"
                        ? t("statusDone")
                        : t("statusDraft")}
                    </span>
                  </td>
                  <td
                    style={{ padding: "1rem", textAlign: "right" }}
                    data-label={t("actions")}
                  >
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() =>
                          handleDownloadPDF(
                            albaran._id,
                            albaran.serie,
                            albaran.AlbaranNumber
                          )
                        }
                        style={{
                          padding: "0.5rem",
                          fontSize: "0.8rem",
                          backgroundColor: "transparent",
                          color: "#ef4444",
                          borderRadius: "4px",
                          border: "1px solid #fee2e2",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title={t("downloadPDF")}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z" />
                          <path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.771.08-1.177.313-.606.746-1.125 1.258-1.474a.846.846 0 0 1 .493-.162c.31 0 .637.228.853.51.272.355.244.82-.046 1.135-.386.415-.89.65-1.446.738a1.59 1.59 0 0 1-.754-.15zm1.517-5.01c-.13-.186-.396-.346-.685-.346-.388 0-.671.216-.838.452-.164.23-.217.58-.09.914.184.484.58.746 1.056.746.402 0 .699-.186.887-.406.19-.22.257-.542.127-.893a.96.96 0 0 0-.457-.467zM10.87 9.873c-.092-.22-.304-.265-.487-.22a1.72 1.72 0 0 0-.82.34l-.403.267c-.206.142-.435.31-.62.482-.127.118-.328.32-.477.534-.145.21-.247.45-.3.687-.075.334.02.668.225.86.196.182.46.225.708.19.467-.066.903-.309 1.272-.647.367-.336.657-.75.787-1.175.068-.22.115-.466.115-.658 0-.17-.046-.35-.115-.53l-.085-.13zm-.793 1.956c-.206 0-.39-.115-.503-.284-.132-.196-.062-.516.143-.807.164-.23.41-.453.69-.613.31-.176.65-.24 1.015-.24.28 0 .546.046.787.14a3.52 3.52 0 0 1 .634.346c.143.102.26.22.316.347.054.12.062.247.02.375-.065.196-.28.336-.513.336a1.18 1.18 0 0 1-.555-.17l-.546-.307c-.426-.24-.764-.534-.954-.805L10 11.455a4.01 4.01 0 0 1-.685.29c-.21.066-.37.085-.453.085z" />
                        </svg>
                      </button>
                      <Link
                        to={`/albaranes/${albaran._id}/edit`}
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
                        onClick={() => handleDelete(albaran._id)}
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

      {/* Pagination */}
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

export default AlbaranList;
