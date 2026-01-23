import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../api/axios";
import { useLanguage } from "../context/LanguageContext";
import { useConfig } from "../context/ConfigContext";
import { useNotification } from "../context/NotificationContext";

const BillForm = () => {
  const { t } = useLanguage();
  const { config } = useConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { showNotification } = useNotification();
  const isViewMode = location.pathname.includes("/view");
  const isEditMode = !!id && !isViewMode;

  const combineDateWithCurrentTime = useCallback(
    (dateStr) => {
      if (!dateStr) return null;
      const targetTz = config.timezone || "Europe/Madrid";
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: targetTz,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      const nowInTz = formatter.format(now);
      const temp = new Date(`${dateStr}T${nowInTz}`);
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: targetTz,
        hour12: false,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
      }).formatToParts(temp);
      const p = parts.reduce(
        (acc, part) => ({ ...acc, [part.type]: part.value }),
        {},
      );
      const dateFormatted = `${p.year}-${p.month.padStart(
        2,
        "0",
      )}-${p.day.padStart(2, "0")}T${p.hour.padStart(
        2,
        "0",
      )}:${p.minute.padStart(2, "0")}:${p.second.padStart(2, "0")}`;
      const diff = temp.getTime() - new Date(dateFormatted).getTime();
      return new Date(temp.getTime() + diff).toISOString();
    },
    [config.timezone],
  );

  const getTodayStr = useCallback(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: config.timezone || "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(now);
  }, [config.timezone]);

  const [formData, setFormData] = useState({
    serie: "",
    billNumber: "",
    supplierName: "",
    supplierNIF: "",
    supplier: "",
    services: [],
    totalAmount: 0,
    status: "Pending",
    date: "",
    dueDate: "",
    orderNumber: "",
    paymentMethod: "Transferencia",
  });

  useEffect(() => {
    if (!isEditMode && config.timezone) {
      const today = getTodayStr();
      const defaultSerie = config?.series?.bills?.[0] || "";
      setFormData((prev) => ({
        ...prev,
        date: prev.date || today,
        dueDate: prev.dueDate || today,
        serie: prev.serie || defaultSerie,
      }));
    }
  }, [
    config.timezone,
    config.series,
    isEditMode,
    formData.date,
    formData.dueDate,
    formData.serie,
    getTodayStr,
  ]);

  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [paymentTerm, setPaymentTerm] = useState("custom");
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);

  const [supplierMode, setSupplierMode] = useState("existing");
  const [newSupplierData, setNewSupplierData] = useState({
    name: "",
    nif: "",
    email: "",
    phone: "",
    address: "",
    postalCode: "",
    city: "",
    province: "",
    country: "",
    paymentMethod: "Transferencia",
    paymentTerms: "1 day",
    paymentTermsManual: "",
  });

  const fetchBill = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/bills/${id}`);
      const bill = response.data;
      const formatDate = (date) => {
        if (!date) return "";
        return new Intl.DateTimeFormat("en-CA", {
          timeZone: config.timezone || "Europe/Madrid",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(date));
      };

      setFormData({
        ...bill,
        date: formatDate(bill.date),
        dueDate: formatDate(bill.dueDate),
      });

      if (bill.supplier) {
        setSupplierMode("existing");
      }
    } catch (err) {
      console.error("Error fetching bill:", err);
      setError(t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isEditMode) fetchBill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await api.get("/suppliers?limit=100");
        setSuppliers(response.data.suppliers || []);
      } catch (err) {
        console.error("Error fetching suppliers:", err);
      }
    };
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const fetchNextNumber = async () => {
      if (isEditMode || formData.status === "Draft" || !formData.serie) return;
      try {
        const response = await api.get(
          `/bills/next-number?serie=${formData.serie}`,
        );
        setFormData((prev) => ({
          ...prev,
          billNumber: response.data.nextNumber,
        }));
      } catch (err) {
        console.error("Error fetching next number:", err);
      }
    };
    if (!formData.billNumber && formData.status !== "Draft") {
      fetchNextNumber();
    }
  }, [formData.serie, formData.status, formData.billNumber, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError(null);
  };

  const handleSupplierNameChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, supplierName: value, supplier: "" });
    setIsSupplierDropdownOpen(true);
    if (value) {
      const filtered = suppliers.filter((s) =>
        s.name.toLowerCase().includes(value.toLowerCase()),
      );
      setFilteredSuppliers(filtered);
    } else {
      setFilteredSuppliers([]);
    }
  };

  const selectSupplier = (s) => {
    setFormData({
      ...formData,
      supplier: s._id,
      supplierName: s.name,
      supplierNIF: s.nif,
      paymentMethod: s.paymentMethod || "Transferencia",
    });

    if (s.paymentTerms && s.paymentTerms !== "Manual") {
      setPaymentTerm(s.paymentTerms.split(" ")[0]);
    } else {
      setPaymentTerm("custom");
    }
    setIsSupplierDropdownOpen(false);
  };

  const handleNewSupplierChange = (e) => {
    const { name, value } = e.target;
    setNewSupplierData({ ...newSupplierData, [name]: value });
    if (name === "paymentMethod") {
      setFormData((prev) => ({ ...prev, paymentMethod: value }));
    }
  };

  const getSelectedSupplierDetails = () => {
    if (!formData.supplier) return null;
    return suppliers.find((s) => s._id === formData.supplier);
  };

  const addService = () => {
    setFormData({
      ...formData,
      services: [
        ...formData.services,
        {
          number: "",
          concept: "",
          quantity: 1,
          taxBase: 0,
          discount: 0,
          iva: 21,
        },
      ],
    });
  };

  const handleServiceChange = (index, e) => {
    const { name, value } = e.target;
    const newServices = [...formData.services];
    newServices[index][name] = value;
    setFormData({ ...formData, services: newServices });
  };

  const removeService = (index) => {
    const newServices = formData.services.filter((_, i) => i !== index);
    setFormData({ ...formData, services: newServices });
  };

  useEffect(() => {
    const total = formData.services.reduce((acc, s) => {
      const b = parseFloat(s.taxBase) || 0;
      const q = parseFloat(s.quantity) || 0;
      const d = parseFloat(s.discount) || 0;
      const i = parseFloat(s.iva) || 0;
      const sub = b * q;
      const taxable = sub - sub * (d / 100);
      return acc + taxable + taxable * (i / 100);
    }, 0);
    setFormData((prev) => ({
      ...prev,
      totalAmount: parseFloat(total.toFixed(2)),
    }));
  }, [formData.services]);

  useEffect(() => {
    if (paymentTerm !== "custom" && formData.date && !isViewMode) {
      const days = parseInt(paymentTerm);
      if (isNaN(days)) return;
      const due = new Date(formData.date);
      due.setDate(due.getDate() + days);
      setFormData((prev) => ({
        ...prev,
        dueDate: due.toISOString().split("T")[0],
      }));
    }
  }, [formData.date, paymentTerm, isViewMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    let finalData = { ...formData };

    if (supplierMode === "new") {
      try {
        const res = await api.post("/suppliers", newSupplierData);
        finalData.supplier = res.data._id;
        finalData.supplierName = res.data.name;
        finalData.supplierNIF = res.data.nif;
      } catch (err) {
        setFormError(
          "Error creating supplier: " +
            (err.response?.data?.message || err.message),
        );
        return;
      }
    }

    try {
      const payload = {
        ...finalData,
        dueDate: combineDateWithCurrentTime(finalData.dueDate),
        date: combineDateWithCurrentTime(finalData.date || getTodayStr()),
      };

      if (isEditMode) {
        await api.put(`/bills/${id}`, payload);
      } else {
        await api.post("/bills", payload);
      }
      showNotification && showNotification(t("changesSaved"), "success");
      navigate("/bills");
    } catch (err) {
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
    <div style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
      <div
        className="flex justify-between items-center"
        style={{ marginBottom: "1.5rem" }}
      >
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600" }}>
          {isViewMode
            ? t("viewBill")
            : isEditMode
              ? t("editBill")
              : t("newBill")}
        </h2>
        <button
          onClick={() => navigate("/bills")}
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
          <fieldset
            disabled={isViewMode}
            style={{ border: "none", padding: 0, margin: 0 }}
          >
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
              <div style={{ gridColumn: "span 2" }}>
                <div
                  style={{
                    display: "flex",
                    gap: "1.5rem",
                    marginBottom: "1rem",
                    borderBottom: "1px solid #e2e8f0",
                    paddingBottom: "0.5rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSupplierMode("existing")}
                    style={{
                      background: "none",
                      border: "none",
                      borderBottom:
                        supplierMode === "existing"
                          ? "2px solid #6366f1"
                          : "2px solid transparent",
                      color:
                        supplierMode === "existing" ? "#6366f1" : "#64748b",
                      fontWeight: "600",
                      padding: "0.5rem 0",
                      cursor: "pointer",
                    }}
                  >
                    {t("chooseExistingSupplier") ||
                      "Escoger proveedor existente"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupplierMode("new")}
                    style={{
                      background: "none",
                      border: "none",
                      borderBottom:
                        supplierMode === "new"
                          ? "2px solid #6366f1"
                          : "2px solid transparent",
                      color: supplierMode === "new" ? "#6366f1" : "#64748b",
                      fontWeight: "600",
                      padding: "0.5rem 0",
                      cursor: "pointer",
                    }}
                  >
                    + {t("createNewSupplier") || "Crear nuevo proveedor"}
                  </button>
                </div>

                {supplierMode === "existing" ? (
                  <>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "500",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {t("supplier")}
                    </label>
                    <div style={{ position: "relative", marginBottom: "1rem" }}>
                      <input
                        type="text"
                        name="supplierName"
                        value={formData.supplierName}
                        onChange={handleSupplierNameChange}
                        onFocus={() => {
                          if (suppliers.length > 0) {
                            setFilteredSuppliers(suppliers);
                            setIsSupplierDropdownOpen(true);
                          }
                        }}
                        onBlur={() =>
                          setTimeout(
                            () => setIsSupplierDropdownOpen(false),
                            200,
                          )
                        }
                        required={supplierMode === "existing"}
                        style={{
                          fontSize: "1rem",
                          width: "100%",
                          padding: "0.5rem",
                          borderRadius: "0.375rem",
                          border: "1px solid #cbd5e1",
                        }}
                        placeholder={
                          t("placeholderSupplier") || "Buscar proveedor..."
                        }
                        autoComplete="off"
                      />
                      {isSupplierDropdownOpen &&
                        filteredSuppliers.length > 0 && (
                          <ul
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              backgroundColor: "white",
                              border: "1px solid #cbd5e1",
                              borderRadius: "0.375rem",
                              zIndex: 10,
                              maxHeight: "200px",
                              overflowY: "auto",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            }}
                          >
                            {filteredSuppliers.map((s) => (
                              <li
                                key={s._id}
                                onClick={() => selectSupplier(s)}
                                style={{
                                  padding: "0.5rem",
                                  cursor: "pointer",
                                  borderBottom: "1px solid #f1f5f9",
                                }}
                                className="hover:bg-gray-50"
                              >
                                <div style={{ fontWeight: "500" }}>
                                  {s.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "var(--color-text-secondary)",
                                  }}
                                >
                                  {s.nif}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>

                    {getSelectedSupplierDetails() && (
                      <div
                        style={{
                          padding: "1rem",
                          backgroundColor: "#f8fafc",
                          borderRadius: "0.5rem",
                          border: "1px solid #e2e8f0",
                          marginBottom: "1rem",
                        }}
                      >
                        <h4
                          style={{
                            margin: "0 0 0.25rem 0",
                            fontWeight: "600",
                            fontSize: "1rem",
                          }}
                        >
                          {getSelectedSupplierDetails().name}
                        </h4>
                        <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                          NIF: {getSelectedSupplierDetails().nif}
                        </div>
                        {getSelectedSupplierDetails().phone && (
                          <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                            {t("phone")}: {getSelectedSupplierDetails().phone}
                          </div>
                        )}
                        {getSelectedSupplierDetails().address && (
                          <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                            {[
                              getSelectedSupplierDetails().address,
                              getSelectedSupplierDetails().postalCode,
                              getSelectedSupplierDetails().city,
                              getSelectedSupplierDetails().country,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <div style={{ gridColumn: "span 2" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "0.5rem",
                          fontWeight: "500",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {t("name")}
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={newSupplierData.name}
                        onChange={handleNewSupplierChange}
                        required={supplierMode === "new"}
                        style={{
                          fontSize: "1rem",
                          width: "100%",
                          padding: "0.5rem",
                          borderRadius: "0.375rem",
                          border: "1px solid #cbd5e1",
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
                        {t("supplierNIF")}
                      </label>
                      <input
                        type="text"
                        name="nif"
                        value={newSupplierData.nif}
                        onChange={handleNewSupplierChange}
                        required={supplierMode === "new"}
                        style={{
                          fontSize: "1rem",
                          width: "100%",
                          padding: "0.5rem",
                          borderRadius: "0.375rem",
                          border: "1px solid #cbd5e1",
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
                        {t("phone")}
                      </label>
                      <input
                        type="text"
                        name="phone"
                        value={newSupplierData.phone}
                        onChange={handleNewSupplierChange}
                        style={{
                          fontSize: "1rem",
                          width: "100%",
                          padding: "0.5rem",
                          borderRadius: "0.375rem",
                          border: "1px solid #cbd5e1",
                        }}
                      />
                    </div>
                  </div>
                )}
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
                  {config?.series?.bills?.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
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
                  {t("billNumber")}
                </label>
                <input
                  type="number"
                  name="billNumber"
                  value={formData.billNumber}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
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
                  {t("date")}
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
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
                  {t("dueDate")}
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <select
                    value={paymentTerm}
                    onChange={(e) => setPaymentTerm(e.target.value)}
                    style={{
                      padding: "0.5rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "white",
                    }}
                  >
                    <option value="0">{t("today")}</option>
                    <option value="7">7 {t("days")}</option>
                    <option value="15">15 {t("days")}</option>
                    <option value="30">30 {t("days")}</option>
                    <option value="60">60 {t("days")}</option>
                    <option value="custom">{t("manual")}</option>
                  </select>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    disabled={paymentTerm !== "custom"}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #cbd5e1",
                      backgroundColor:
                        paymentTerm !== "custom" ? "#f3f4f6" : "white",
                    }}
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
                  <option value="Pending">{t("statusPending")}</option>
                  <option value="Paid">{t("statusPaid")}</option>
                  <option value="Draft">{t("statusDraft")}</option>
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
                  {t("paymentMethod")}
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  <option value="Transferencia">{t("transfer")}</option>
                  <option value="Efectivo">{t("cash")}</option>
                  <option value="Tarjeta">{t("card")}</option>
                  <option value="Domiciliación bancaria">
                    {t("directDebit")}
                  </option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: "2rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h3 style={{ fontSize: "1.1rem", fontWeight: "600" }}>
                  {t("services")}
                </h3>
                <button
                  type="button"
                  onClick={addService}
                  style={{
                    color: "#6366f1",
                    fontWeight: "600",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  + {t("addService")}
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {formData.services.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "0.8fr 3.2fr 0.8fr 1.6fr 1fr 1fr 0.5fr",
                      gap: "0.5rem",
                      marginBottom: "0.5rem",
                      paddingRight: "0.5rem",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        color: "var(--color-text-secondary)",
                        paddingLeft: "0.5rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t("number")}
                    </label>
                    <label
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        color: "var(--color-text-secondary)",
                        paddingLeft: "0.5rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t("concept")}
                    </label>
                    <label
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        color: "var(--color-text-secondary)",
                        paddingLeft: "0.5rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t("quantity")}
                    </label>
                    <label
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        color: "var(--color-text-secondary)",
                        paddingLeft: "0.5rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t("taxBase")}
                    </label>
                    <label
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        color: "var(--color-text-secondary)",
                        paddingLeft: "0.5rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t("discount")}
                    </label>
                    <label
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        color: "var(--color-text-secondary)",
                        paddingLeft: "0.5rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t("iva")}
                    </label>
                    <div></div>
                  </div>
                )}

                {formData.services.map((s, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "0.8fr 3.2fr 0.8fr 1.6fr 1fr 1fr 0.5fr",
                      gap: "0.5rem",
                      alignItems: "center",
                      paddingBottom: "1rem",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <div>
                      <input
                        type="text"
                        name="number"
                        value={s.number || ""}
                        onChange={(e) => handleServiceChange(idx, e)}
                        placeholder="Nº"
                        style={{
                          width: "100%",
                          padding: "0.4rem",
                          fontSize: "0.9rem",
                          border: "1px solid #cbd5e1",
                          borderRadius: "0.25rem",
                        }}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        name="concept"
                        value={s.concept}
                        onChange={(e) => handleServiceChange(idx, e)}
                        style={{
                          width: "100%",
                          padding: "0.4rem",
                          fontSize: "0.9rem",
                          border: "1px solid #cbd5e1",
                          borderRadius: "0.25rem",
                        }}
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        name="quantity"
                        value={s.quantity}
                        onChange={(e) => handleServiceChange(idx, e)}
                        style={{
                          width: "100%",
                          padding: "0.4rem",
                          fontSize: "0.9rem",
                          border: "1px solid #cbd5e1",
                          borderRadius: "0.25rem",
                        }}
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        step="0.01"
                        name="taxBase"
                        value={s.taxBase}
                        onChange={(e) => handleServiceChange(idx, e)}
                        style={{
                          width: "100%",
                          padding: "0.4rem",
                          fontSize: "0.9rem",
                          border: "1px solid #cbd5e1",
                          borderRadius: "0.25rem",
                        }}
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        name="discount"
                        value={s.discount}
                        onChange={(e) => handleServiceChange(idx, e)}
                        style={{
                          width: "100%",
                          padding: "0.4rem",
                          fontSize: "0.9rem",
                          border: "1px solid #cbd5e1",
                          borderRadius: "0.25rem",
                        }}
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        name="iva"
                        value={s.iva}
                        onChange={(e) => handleServiceChange(idx, e)}
                        style={{
                          width: "100%",
                          padding: "0.4rem",
                          fontSize: "0.9rem",
                          border: "1px solid #cbd5e1",
                          borderRadius: "0.25rem",
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeService(idx)}
                      style={{
                        padding: "0.4rem",
                        color: "#ef4444",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                marginTop: "2rem",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: "2rem",
              }}
            >
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                  {t("totalAmount")}
                </div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "700",
                    color: "#4f46e5",
                  }}
                >
                  {formData.totalAmount.toFixed(2)}€
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "2.5rem",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "0.75rem 2.5rem", fontSize: "1rem" }}
              >
                {t("save")}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
};

export default BillForm;
