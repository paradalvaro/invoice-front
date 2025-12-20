import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { useLanguage } from "../context/LanguageContext";

const InvoiceForm = () => {
  const { t } = useLanguage();

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
    serie: "A2025",
    invoiceNumber: "",
    clientName: "",
    totalAmount: "",
    status: "Pending",
    date: getTodayStr(),
    dueDate: getTodayStr(),
  });
  const [initialInvoiceData, setInitialInvoiceData] = useState(null);
  const [paymentTerm, setPaymentTerm] = useState("custom");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

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
        date: formattedDate,
        dueDate: formattedDueDate,
      });
      setInitialInvoiceData({
        ...invoice,
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
    if (isEditMode) {
      fetchInvoice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

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
    }
  };

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
          {isEditMode ? t("editInvoice") : t("newInvoice")}
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
            }}
          >
            <div style={{ gridColumn: "1 / -1" }}>
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
                required
                style={{ fontSize: "1rem" }}
                placeholder={t("placeholderClient")}
              />
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
                display: "grid",
                gridTemplateColumns: "1fr 2fr",
                gap: "1.5rem",
              }}
            >
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
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  <option value="A2025">A2025</option>
                  <option value="A2026">A2026</option>
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
                    width: "100%",
                    backgroundColor: "#f3f4f6",
                    cursor: "not-allowed",
                  }}
                />
              </div>
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
                    color: "#64748b",
                  }}
                >
                  €
                </span>
                <input
                  type="number"
                  name="totalAmount"
                  value={formData.totalAmount}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: "2rem" }}
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
