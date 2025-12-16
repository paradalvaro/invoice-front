import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import { useLanguage } from "../context/LanguageContext";

const baseURL = import.meta.env.VITE_SERVER_URL;

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // const { logout } = useAuth();

  const fetchInvoices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(
        `/invoices?page=${pagination.currentPage}&limit=10`
      );
      if (response.data.data) {
        setInvoices(response.data.data);
        setPagination((prev) => ({
          ...prev,
          totalPages: response.data.totalPages,
          totalItems: response.data.totalItems,
        }));
      } else {
        // Fallback if backend API hasn't been updated yet or returns different structure
        setInvoices(Array.isArray(response.data) ? response.data : []);
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
  }, [pagination.currentPage]);

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
          <span style={{ color: "var(--color-primary)", cursor: "pointer" }}>
            ⌄
          </span>
        </div>
        <div className="flex gap-2">
          <Link to="/invoices/new" className="btn btn-primary">
            + {t("new")}
          </Link>
          <button className="btn btn-secondary" style={{ padding: "0.5rem" }}>
            ...
          </button>
        </div>
      </div>

      {/* Filter/Action Bar Pattern (Visual placeholder based on image) */}
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
                {t("date")}
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
                {t("invoiceNumber")}
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
                {t("clientName")}
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
                {t("dueDate")}
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
                {t("totalAmount")}
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
                {t("balanceDue")}
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
                  <td style={{ padding: "1rem" }}>
                    <input type="checkbox" />
                  </td>
                  <td style={{ padding: "1rem", fontSize: "0.9rem" }}>
                    {new Date(invoice.date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "1rem", fontSize: "0.9rem" }}>
                    <Link
                      to={`/invoices/${invoice._id}/edit`}
                      style={{
                        color: "var(--color-primary)",
                        fontWeight: "500",
                      }}
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                    }}
                  >
                    {invoice.clientName}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                    }}
                  >
                    {invoice.userId?.username || "N/A"}
                  </td>
                  <td style={{ padding: "1rem" }}>
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
                            : "#fef9c3",
                        color:
                          invoice.status === "Paid"
                            ? "#166534"
                            : invoice.status === "Draft"
                            ? "#64748b"
                            : "#854d0e",
                        fontWeight: "600",
                        textTransform: "uppercase",
                      }}
                    >
                      {invoice.status === "Paid"
                        ? t("statusPaid")
                        : invoice.status === "Draft"
                        ? t("statusDraft")
                        : t("statusPending")}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", fontSize: "0.9rem" }}>
                    {invoice.dueDate
                      ? new Date(invoice.dueDate).toLocaleDateString()
                      : "-"}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      textAlign: "right",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                    }}
                  >
                    €{invoice.totalAmount}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      textAlign: "right",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                    }}
                  >
                    €{invoice.status === "Paid" ? "0.00" : invoice.totalAmount}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
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

                      {(currentUser?.type === "Admin" ||
                        currentUser?.type === "SuperAdmin") && (
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
                      )}
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

export default InvoiceList;
