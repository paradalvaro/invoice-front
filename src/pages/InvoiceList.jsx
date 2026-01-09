import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
//import useAuth from "../hooks/useAuth";
import { useLanguage } from "../context/LanguageContext";

import { useNotification } from "../context/NotificationContext";

const baseURL = import.meta.env.VITE_SERVER_URL;

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("clientName");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [dueDateRangeFilter, setDueDateRangeFilter] = useState("");
  const [totals, setTotals] = useState({ paid: 0, pending: 0, expired: 0 });
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [recipientEmails, setRecipientEmails] = useState("");

  const { t } = useLanguage();
  const { showNotification } = useNotification();

  const fetchInvoices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(
        `/invoices?page=${pagination.currentPage}&limit=10&sortBy=${sortBy}&order=${sortOrder}&search=${search}&searchField=${searchField}&status=${statusFilter}&dueDateRange=${dueDateRangeFilter}`
      );
      if (response.data.data) {
        setInvoices(response.data.data);
        setPagination((prev) => ({
          ...prev,
          totalPages: response.data.totalPages,
          totalItems: response.data.totalItems,
        }));
        setTotals(response.data.totals || { paid: 0, pending: 0, expired: 0 });
      } else {
        setInvoices(Array.isArray(response.data) ? response.data : []);
        setTotals({ paid: 0, pending: 0, expired: 0 });
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError(t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pagination.currentPage,
    sortBy,
    sortOrder,
    search,
    searchField,
    statusFilter,
    dueDateRangeFilter,
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

  const handleSendEmail = (id) => {
    setSelectedInvoiceId(id);
    setRecipientEmails("");
    setIsEmailModalOpen(true);
  };

  const confirmSendEmail = async () => {
    if (!recipientEmails.trim()) {
      showNotification(t("invalidEmails"), "error");
      return;
    }

    try {
      await api.post(`/invoices/${selectedInvoiceId}/sendEmail`, {
        emails: recipientEmails,
      });
      showNotification(
        t("emailSentSuccess") || "Invoice sent by email",
        "success"
      );
      setIsEmailModalOpen(false);
    } catch (err) {
      console.error("Error sending invoice:", err);
      showNotification(t("emailSentError") || "Error sending invoice", "error");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t("confirmDelete"))) {
      try {
        await api.delete(`/invoices/${id}`);
        fetchInvoices();
      } catch (err) {
        console.error("Error deleting invoice:", err);
      }
    }
  };

  const handleMarkAsPaid = async (id) => {
    if (window.confirm(t("confirmMarkAsPaid"))) {
      try {
        await api.put(`/invoices/${id}/paid`);
        fetchInvoices();
        showNotification(t("changesSaved"), "success");
      } catch (err) {
        console.error("Error marking invoice as paid:", err);
        showNotification(t("error"), "error");
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
              {t("allInvoices")}
            </h2>
          )}
        </div>
        <div className="flex gap-2">
          <Link to="/invoices/new" className="btn btn-primary">
            + {t("new")}
          </Link>
        </div>
      </div>

      {/* Balance Bar */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          backgroundColor: "white",
          padding: "1rem",
          borderRadius: "8px",
          boxShadow: "var(--shadow-sm)",
          marginBottom: "1.5rem",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ flex: 1 }}>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: "600",
                color: "#166534", // Green
              }}
            >
              {t("statusPaid")}
            </span>
            <div style={{ fontSize: "1.2rem", fontWeight: "700" }}>
              €
              {totals.paid.toLocaleString("es-ES", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: "600",
                color: "#d97706", // Orange
              }}
            >
              {t("statusPending")}
            </span>
            <div style={{ fontSize: "1.2rem", fontWeight: "700" }}>
              €
              {totals.pending.toLocaleString("es-ES", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <div style={{ flex: 1, textAlign: "right" }}>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: "600",
                color: "#dc2626", // Red
              }}
            >
              {t("statusExpired")}
            </span>
            <div style={{ fontSize: "1.2rem", fontWeight: "700" }}>
              €
              {totals.expired.toLocaleString("es-ES", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            height: "12px",
            borderRadius: "6px",
            overflow: "hidden",
            width: "100%",
            backgroundColor: "#f1f5f9",
          }}
        >
          {(() => {
            const total = totals.paid + totals.pending + totals.expired;
            if (total === 0) return null;
            const paidPct = (totals.paid / total) * 100;
            const pendingPct = (totals.pending / total) * 100;
            const expiredPct = (totals.expired / total) * 100;

            return (
              <>
                <div
                  style={{ width: `${paidPct}%`, backgroundColor: "#10b981" }}
                  title={`${t("statusPaid")}: ${paidPct.toFixed(1)}%`}
                />
                <div
                  style={{
                    width: `${pendingPct}%`,
                    backgroundColor: "#f59e0b",
                  }}
                  title={`${t("statusPending")}: ${pendingPct.toFixed(1)}%`}
                />
                <div
                  style={{
                    width: `${expiredPct}%`,
                    backgroundColor: "#ef4444",
                  }}
                  title={`${t("statusExpired")}: ${expiredPct.toFixed(1)}%`}
                />
              </>
            );
          })()}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.75rem",
            color: "#64748b",
          }}
        >
          {(() => {
            const total = totals.paid + totals.pending + totals.expired;
            if (total === 0) return null;
            return (
              <>
                <span>{((totals.paid / total) * 100).toFixed(0)}%</span>
                <span>{((totals.pending / total) * 100).toFixed(0)}%</span>
                <span>{((totals.expired / total) * 100).toFixed(0)}%</span>
              </>
            );
          })()}
        </div>
      </div>

      {/* Filter/Action Bar Pattern */}
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
            <option value="clientName">{t("clientName")}</option>
            <option value="clientNIF">{t("clientNIF")}</option>
            <option value="invoiceNumber">{t("invoiceNumber")}</option>
            <option value="serie">{t("serie")}</option>
            <option value="type">{t("type") || "Type"}</option>
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
            <option value="Pending">{t("statusPending")}</option>
            <option value="Paid">{t("statusPaid")}</option>
          </select>

          <select
            value={dueDateRangeFilter}
            onChange={(e) => {
              setDueDateRangeFilter(e.target.value);
              setPagination((prev) => ({ ...prev, currentPage: 1 }));
            }}
            style={{
              padding: "0.5rem",
              border: "1px solid var(--color-border)",
              borderRadius: "4px",
              fontSize: "0.9rem",
              backgroundColor: "white",
              minWidth: "200px",
            }}
          >
            <option value="">{t("allExpirations")}</option>
            <option value="thisMonth">{t("expireThisMonth")}</option>
            <option value="nextMonth">{t("expireNextMonth")}</option>
            <option value="moreThanTwoMonths">
              {t("expireMoreThanTwoMonths")}
            </option>
            <option value="next30Days">{t("expireNext30Days")}</option>
            <option value="next60Days">{t("expireNext60Days")}</option>
            <option value="next90Days">{t("expireNext90Days")}</option>
            <option value="moreThan90Days">{t("expireMoreThan90Days")}</option>
          </select>
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
                style={{
                  padding: "1rem",
                  textAlign: "left",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "#64748b",
                  textTransform: "uppercase",
                }}
              >
                <input type="checkbox" />
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
                {t("serie")}
              </th>
              <th
                onClick={() => handleSort("invoiceNumber")}
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
                  {t("invoiceNumber")} <SortIcon field="invoiceNumber" />
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
                {t("type") || "Type"}
              </th>
              <th
                onClick={() => handleSort("clientName")}
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
                  {t("clientName")} <SortIcon field="clientName" />
                </div>
              </th>
              <th
                onClick={() => handleSort("clientNIF")}
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
                  {t("clientNIF")} <SortIcon field="clientNIF" />
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
                {t("owner")}
              </th>
              <th
                onClick={() => handleSort("status")}
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
                  {t("status")} <SortIcon field="status" />
                </div>
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
                {t("balanceDue")}
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
                onClick={() => handleSort("dueDate")}
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
                  {t("dueDate")} <SortIcon field="dueDate" />
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
            {invoices.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {t("noInvoices")}
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr
                  key={invoice._id}
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                  className="hover:bg-gray-50"
                >
                  <td style={{ padding: "1rem" }} data-label="">
                    <input type="checkbox" />
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontSize: "0.9rem",
                      textAlign: "center",
                    }}
                    data-label={t("serie")}
                  >
                    {invoice.serie || "-"}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontSize: "0.9rem",
                      textAlign: "center",
                    }}
                    data-label={t("invoiceNumber")}
                  >
                    <Link
                      to={`/invoices/${invoice._id}/edit`}
                      style={{
                        color: "var(--color-primary)",
                        fontWeight: "500",
                      }}
                    >
                      {invoice.invoiceNumber || "-"}
                    </Link>
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontSize: "0.9rem",
                      textAlign: "center",
                    }}
                    data-label={t("type") || "Type"}
                  >
                    {invoice.type || "-"}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                    }}
                    data-label={t("clientName")}
                  >
                    {invoice.clientName || "-"}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontSize: "0.9rem",
                    }}
                    data-label={t("clientNIF")}
                  >
                    {invoice.clientNIF}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                    }}
                    data-label={t("owner")}
                  >
                    {invoice.userId?.username || "-"}
                  </td>
                  <td style={{ padding: "1rem" }} data-label={t("status")}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        backgroundColor:
                          invoice.status === "Paid"
                            ? "#dcfce7"
                            : invoice.status === "Draft"
                            ? "#f3f4f6"
                            : new Date(invoice.dueDate) < new Date()
                            ? "#fee2e2"
                            : "#fef9c3",
                        color:
                          invoice.status === "Paid"
                            ? "#166534"
                            : invoice.status === "Draft"
                            ? "#64748b"
                            : new Date(invoice.dueDate) < new Date()
                            ? "#991b1b"
                            : "#854d0e",
                        fontWeight: "600",
                        textTransform: "uppercase",
                      }}
                    >
                      {invoice.status === "Paid"
                        ? t("statusPaid")
                        : invoice.status === "Draft"
                        ? t("statusDraft")
                        : new Date(invoice.dueDate) < new Date()
                        ? t("statusExpired")
                        : t("statusPending")}
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
                    €{invoice.totalAmount.toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      textAlign: "right",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                    }}
                    data-label={t("balanceDue")}
                  >
                    €
                    {invoice.balanceDue !== undefined &&
                    invoice.balanceDue !== null
                      ? invoice.balanceDue.toFixed(2)
                      : invoice.status === "Paid"
                      ? "0.00"
                      : invoice.totalAmount.toFixed(2)}
                  </td>
                  <td
                    style={{ padding: "1rem", fontSize: "0.9rem" }}
                    data-label={t("date")}
                  >
                    {invoice.date
                      ? /*new Date(invoice.date).toLocaleDateString(undefined, {
                      timeZone: "America/Caracas",
                    })*/
                        new Date(invoice.date).toLocaleDateString("es-ES", {
                          timeZone: "Europe/Madrid",
                        })
                      : "-"}
                  </td>
                  <td
                    style={{ padding: "1rem", fontSize: "0.9rem" }}
                    data-label={t("dueDate")}
                  >
                    {
                      /*invoice.dueDate
                      ? new Date(invoice.dueDate).toLocaleDateString(
                          undefined,
                          {
                            timeZone: "Europe/Madrid",
                          }
                        )
                      : "-"*/
                      invoice.dueDate
                        ? new Date(invoice.dueDate).toLocaleDateString(
                            "es-ES",
                            {
                              timeZone: "Europe/Madrid",
                            }
                          )
                        : "-"
                    }
                  </td>
                  <td
                    style={{ padding: "1rem", textAlign: "right" }}
                    data-label={t("actions")}
                  >
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          const token = localStorage.getItem("token");
                          window.open(
                            `${baseURL}/invoices/${invoice._id}/pdf?token=${token}`,
                            "_blank"
                          );
                        }}
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
                      <button
                        onClick={() => handleSendEmail(invoice._id)}
                        style={{
                          padding: "0.5rem",
                          fontSize: "0.8rem",
                          backgroundColor: "var(--color-sidebar-bg)",
                          border: "1px solid var(--color-border)",
                          color: "var(--color-text-secondary)",
                          borderRadius: "4px",
                          cursor: "pointer",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title={t("send")}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z" />
                        </svg>
                      </button>
                      {invoice.status === "Pending" && (
                        <button
                          onClick={() => handleMarkAsPaid(invoice._id)}
                          style={{
                            padding: "0.5rem",
                            fontSize: "0.8rem",
                            backgroundColor: "var(--color-sidebar-bg)",
                            border: "1px solid var(--color-border)",
                            color: "#166534", // Green text
                            borderRadius: "4px",
                            cursor: "pointer",
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          title={t("markAsPaid")}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z" />
                          </svg>
                        </button>
                      )}
                      {invoice.status !== "Draft" && (
                        <>
                          <Link
                            to={`/invoices/${invoice._id}/rectify`}
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
                            title={t("rectify")}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              fill="currentColor"
                              viewBox="0 0 16 16"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"
                              />
                              <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966a.25.25 0 0 0 .41-.192z" />
                            </svg>
                          </Link>
                        </>
                      )}
                      {
                        /*(currentUser?.type === "Admin" ||
                        currentUser?.type === "SuperAdmin")*/
                        invoice.status === "Draft" && (
                          <>
                            <Link
                              to={`/invoices/${invoice._id}/edit`}
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
                              onClick={() => handleDelete(invoice._id)}
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
                          </>
                        )
                      }
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

      {/* Email Modal */}
      {isEmailModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "8px",
              width: "400px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3
              style={{
                marginBottom: "1rem",
                fontSize: "1.25rem",
                fontWeight: "600",
              }}
            >
              {t("emailModalTitle")}
            </h3>
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                {t("recipientEmailsLabel")}
              </label>
              <textarea
                value={recipientEmails}
                onChange={(e) => setRecipientEmails(e.target.value)}
                placeholder={t("emailPlaceholder")}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid var(--color-border)",
                  fontSize: "0.9rem",
                  minHeight: "80px",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "1rem",
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setIsEmailModalOpen(false)}
              >
                {t("cancel")}
              </button>
              <button className="btn btn-primary" onClick={confirmSendEmail}>
                {t("sendToEmails")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
