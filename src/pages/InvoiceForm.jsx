import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../api/axios";
import { useLanguage } from "../context/LanguageContext";

const InvoiceForm = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isRectifyMode = location.pathname.endsWith("/rectify");
  const isEditMode = !!id && !isRectifyMode;

  // Helper to combine a YYYY-MM-DD string with the current local time
  const combineDateWithCurrentTime = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-").map(Number);
    const now = new Date();
    // Create new date using parts + current time
    const combined = new Date(
      year,
      month - 1,
      day,
      now.getHours() - 4, //CARACAS TIME
      now.getMinutes(),
      now.getSeconds()
    );
    return combined.toISOString();
  };

  const getTodayStr = () => new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    serie: location.pathname.endsWith("/rectify") ? "R2025" : "A2025",
    type: location.pathname.endsWith("/rectify") ? "R1" : "F1",
    invoiceNumber: "",
    clientName: "",
    clientNIF: "",
    services: [],
    totalAmount: 0,
    status: "Pending",
    date: getTodayStr(),
    dueDate: getTodayStr(),
  });
  const [initialInvoiceData, setInitialInvoiceData] = useState(null);
  const [paymentTerm, setPaymentTerm] = useState("custom");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);

  const fetchInvoice = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/invoices/${id}`);
      const invoice = response.data;
      // Format date for input type="date"
      const formattedDate = new Date(invoice.date).toISOString().split("T")[0];
      const formattedDueDate = invoice.dueDate
        ? new Date(invoice.dueDate).toISOString().split("T")[0]
        : "";
      setFormData({
        ...invoice,
        serie: isRectifyMode ? "R2025" : invoice.serie, // Force R series for rectification
        type: isRectifyMode ? "R1" : invoice.type, // Force R type for rectification
        rectifyInvoice: isRectifyMode
          ? invoice.serie + invoice.invoiceNumber
          : "",
        services: (invoice.services || []).map((s) => ({
          ...s,
          quantity: s.quantity || 1,
        })),
        date: formattedDate,
        dueDate: formattedDueDate,
      });
      setInitialInvoiceData({
        ...invoice,
        services: (invoice.services || []).map((s) => ({
          ...s,
          quantity: s.quantity || 1,
        })),
        date: formattedDate,
        dueDate: formattedDueDate,
      });

      // Calculate term
      if (formattedDate && formattedDueDate) {
        const start = new Date(formattedDate);
        const end = new Date(formattedDueDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const standardTerms = ["0", "1", "7", "15", "30", "45", "60"];
        if (standardTerms.includes(String(diffDays))) {
          setPaymentTerm(String(diffDays));
        } else {
          setPaymentTerm("custom");
        }
      }
    } catch (err) {
      console.error("Error fetching invoice:", err);
      setError(t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Auto-fetch next number when series changes (only for new invoices or if needed)
  useEffect(() => {
    const fetchNextNumber = async () => {
      // Logic:
      // 1. New Mode: Always fetch when series changes.
      // 2. Edit Mode: Fetch ONLY if series is different from initial.
      // 3. Edit Mode (Revert): If series matches initial, restore initial number.

      if (!formData.serie) return;

      const isSeriesChanged =
        isEditMode &&
        initialInvoiceData &&
        formData.serie !== initialInvoiceData.serie;

      if (!isEditMode || isSeriesChanged) {
        try {
          const response = await api.get(
            `/invoices/next-number?serie=${formData.serie}`
          );
          if (response.data.nextNumber) {
            setFormData((prev) => ({
              ...prev,
              invoiceNumber: response.data.nextNumber,
            }));
          }
        } catch (err) {
          console.error("Error fetching next number:", err);
        }
      } else if (
        isEditMode &&
        initialInvoiceData &&
        formData.serie === initialInvoiceData.serie
      ) {
        setFormData((prev) => ({
          ...prev,
          invoiceNumber: initialInvoiceData.invoiceNumber,
        }));
      }
    };
    fetchNextNumber();
  }, [formData.serie, isEditMode, initialInvoiceData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formError) setFormError(null);
  };

  const handleServiceChange = (index, e) => {
    const { name, value } = e.target;
    const newServices = [...formData.services];
    newServices[index][name] = value;

    if (name === "taxBase" || name === "quantity") {
      const taxBase = parseFloat(newServices[index].taxBase) || 0;
      const quantity = parseFloat(newServices[index].quantity) || 0;
      newServices[index].iva = parseFloat(
        (taxBase * quantity * 0.21).toFixed(2)
      );
    }

    const newTotal = newServices.reduce(
      (acc, s) =>
        acc +
        (parseFloat(s.taxBase) || 0) * (parseFloat(s.quantity) || 0) +
        (parseFloat(s.iva) || 0),
      0
    );

    setFormData({
      ...formData,
      services: newServices,
      totalAmount: parseFloat(newTotal.toFixed(2)),
    });
    if (formError) setFormError(null);
  };

  const addService = () => {
    setFormData({
      ...formData,
      services: [
        ...formData.services,
        { concept: "", quantity: 1, taxBase: 0, iva: 0 },
      ],
    });
  };

  const removeService = (index) => {
    const newServices = [...formData.services];
    newServices.splice(index, 1);
    const newTotal = newServices.reduce(
      (acc, s) =>
        acc +
        (parseFloat(s.taxBase) || 0) * (parseFloat(s.quantity) || 0) +
        (parseFloat(s.iva) || 0),
      0
    );
    setFormData({
      ...formData,
      services: newServices,
      totalAmount: parseFloat(newTotal.toFixed(2)),
    });
  };
  const handleTermChange = (e) => {
    const term = e.target.value;
    setPaymentTerm(term);

    if (term !== "custom") {
      const days = parseInt(term);
      const baseDate = formData.date ? new Date(formData.date) : new Date();
      const dueDate = new Date(baseDate);
      dueDate.setDate(dueDate.getDate() + days);

      setFormData((prev) => ({
        ...prev,
        dueDate: dueDate.toISOString().split("T")[0],
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        date: combineDateWithCurrentTime(formData.date || getTodayStr()),
        dueDate: combineDateWithCurrentTime(formData.dueDate),
      };

      if (isEditMode) {
        await api.put(`/invoices/${id}`, payload);
      } else {
        await api.post("/invoices", payload);
      }
      navigate("/invoices");
    } catch (err) {
      console.error("Error saving invoice:", err);
      setFormError(err.response?.data?.message || err.message);
    }
  };

  if (isLoading && isEditMode) {
    return (
      <div
        className="container"
        style={{
          textAlign: "center",
          padding: "2rem",
          color: "var(--color-text-secondary)",
        }}
      >
        {t("loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="container"
        style={{
          textAlign: "center",
          padding: "2rem",
          color: "var(--color-danger)",
        }}
      >
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div
        className="flex justify-between items-center"
        style={{ marginBottom: "1.5rem" }}
      >
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600" }}>
          {isRectifyMode
            ? t("rectify")
            : isEditMode
            ? t("editInvoice")
            : t("newInvoice")}
        </h2>
        <button
          onClick={() => navigate("/invoices")}
          className="btn btn-secondary"
        >
          {t("cancel")}
        </button>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <form onSubmit={handleSubmit}>
          {formError && (
            <div
              style={{
                backgroundColor: "#fee2e2",
                color: "#ef4444",
                padding: "1rem",
                borderRadius: "0.375rem",
                marginBottom: "1.5rem",
                border: "1px solid #fecaca",
                fontSize: "0.9rem",
              }}
            >
              <strong>{t("error") || "Error"}:</strong> {formError}
            </div>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
            }}
          >
            {isRectifyMode && (
              <>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "500",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {t("rectifyInvoice")}
                  </label>
                  <input
                    type="text"
                    name="rectifyInvoice"
                    value={formData.rectifyInvoice}
                    required
                    readOnly
                    style={{
                      backgroundColor: "#f3f4f6",
                      cursor: "not-allowed",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "500",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {t("rectifyReason")}
                  </label>
                  <select
                    name="rectifyReason"
                    value={formData.rectifyReason}
                    onChange={handleChange}
                    style={{
                      padding: "0.5rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    <option value="Return">{t("return")}</option>
                  </select>
                </div>
              </>
            )}
            {formData.type !== "F2" && (
              <>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "500",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {t("clientName")}
                  </label>
                  <input
                    type="text"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleChange}
                    required={formData.type !== "F2"}
                    style={{ fontSize: "1rem" }}
                    placeholder={t("placeholderClient")}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "500",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {t("clientNIF")}
                  </label>
                  <input
                    type="text"
                    name="clientNIF"
                    value={formData.clientNIF}
                    onChange={handleChange}
                    required={formData.type !== "F2"}
                    style={{ fontSize: "1rem" }}
                    placeholder={t("placeholderNIF")}
                  />
                </div>
              </>
            )}

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                  color: "var(--color-text-secondary)",
                }}
              >
                {t("serie")}
              </label>
              <select
                name="serie"
                value={formData.serie}
                onChange={handleChange}
                style={{
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #cbd5e1",
                }}
              >
                {isRectifyMode ? (
                  <>
                    <option value="R2025">R2025</option>
                    <option value="R2026">R2026</option>
                  </>
                ) : (
                  <>
                    <option value="A2025">A2025</option>
                    <option value="A2026">A2026</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                  color: "var(--color-text-secondary)",
                }}
              >
                {t("type") || "Type"}
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #cbd5e1",
                }}
              >
                {isRectifyMode ? (
                  <>
                    <option value="R1">R1</option>
                    <option value="R4">R4</option>
                  </>
                ) : (
                  <>
                    <option value="F1">F1</option>
                    <option value="F2">F2</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                  color: "var(--color-text-secondary)",
                }}
              >
                {t("invoiceNumber")}
              </label>
              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                required
                readOnly
                placeholder={t("placeholderInvoice")}
                style={{
                  backgroundColor: "#f3f4f6",
                  cursor: "not-allowed",
                }}
              />
            </div>

            {/* <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                  color: "var(--color-text-secondary)",
                }}
              >
                {t("invoiceNumber")}
              </label>
              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                required
                placeholder={t("placeholderInvoice")}
              />
            </div>

            {/* <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                  color: "var(--color-text-secondary)",
                }}
              >
                {t("date")}
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
              */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                  color: "var(--color-text-secondary)",
                }}
              >
                {t("dueDate") || "Due Date"}
              </label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <select
                  value={paymentTerm}
                  onChange={handleTermChange}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "white",
                  }}
                >
                  <option value="0">{t("today") || "Today"}</option>
                  <option value="1">1 {t("day") || "day"}</option>
                  <option value="7">7 {t("days") || "days"}</option>
                  <option value="15">15 {t("days") || "days"}</option>
                  <option value="30">30 {t("days") || "days"}</option>
                  <option value="45">45 {t("days") || "days"}</option>
                  <option value="60">60 {t("days") || "days"}</option>
                  <option value="custom">{t("manual") || "Manual"}</option>
                </select>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={(e) => {
                    handleChange(e);
                    setPaymentTerm("custom");
                  }}
                  required
                  style={{ flex: 1 }}
                  readOnly={paymentTerm !== "custom"}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                  color: "var(--color-text-secondary)",
                }}
              >
                {t("status")}
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #cbd5e1",
                }}
              >
                <option value="Draft">{t("statusDraft")}</option>
                <option value="Pending">{t("statusPending")}</option>
                <option value="Paid">{t("statusPaid")}</option>
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    paddingRight: "0.5rem",
                  }}
                >
                  {t("services")}
                </h3>
                <button
                  type="button"
                  onClick={addService}
                  className="btn btn-secondary"
                  style={{ padding: "0.25rem 0.75rem", fontSize: "0.875rem" }}
                >
                  + {t("addService")}
                </button>
              </div>

              {formData.services.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "4fr 1fr 1.5fr 1.5fr 0.5fr",
                    gap: "1rem",
                    marginBottom: "0.5rem",
                    paddingRight: "0.5rem",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {t("concept")}
                  </label>
                  <label
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {t("quantity")}
                  </label>
                  <label
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {t("taxBase")}
                  </label>
                  <label
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {t("iva")}
                  </label>
                  <div></div>
                </div>
              )}

              {formData.services.map((service, index) => (
                <div
                  key={index}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "4fr 1fr 1.5fr 1.5fr 0.5fr",
                    gap: "1rem",
                    marginBottom: "1rem",
                    paddingBottom: "1rem",
                    borderBottom: "1px solid #f1f5f9",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <input
                      type="text"
                      name="concept"
                      value={service.concept}
                      onChange={(e) => handleServiceChange(index, e)}
                      placeholder={t("concept")}
                      required
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      name="quantity"
                      value={service.quantity}
                      onChange={(e) => handleServiceChange(index, e)}
                      placeholder={t("quantity")}
                      min="1"
                      step="1"
                      required
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      name="taxBase"
                      value={service.taxBase}
                      onChange={(e) => handleServiceChange(index, e)}
                      placeholder={t("taxBase")}
                      step="0.01"
                      required
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      name="iva"
                      value={service.iva}
                      readOnly
                      style={{
                        backgroundColor: "#f8fafc",
                        cursor: "not-allowed",
                        width: "100%",
                      }}
                      placeholder={t("iva")}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      style={{
                        color: "#ef4444",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "1.2rem",
                        padding: "0.5rem",
                        lineHeight: "1",
                      }}
                      title={t("removeService")}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                  color: "var(--color-text-secondary)",
                }}
              >
                {t("totalAmount")}
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#64748b",
                  }}
                >
                  €
                </span>
                <input
                  type="number"
                  name="totalAmount"
                  value={formData.totalAmount}
                  readOnly
                  style={{
                    paddingLeft: "2rem",
                    backgroundColor: "#f3f4f6",
                    cursor: "not-allowed",
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              justifyContent: "flex-end",
              gap: "1rem",
            }}
          >
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: "0.75rem 2rem", fontSize: "1rem" }}
            >
              {isEditMode ? t("updateInvoice") : t("createInvoice")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
