import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { useLanguage } from "../context/LanguageContext";
import { useConfig } from "../context/ConfigContext";
import { useNotification } from "../context/NotificationContext";

const BudgetForm = () => {
  const { t } = useLanguage();
  const { config } = useConfig();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id && id !== "new";
  const { showNotification } = useNotification();

  // Helper to combine a YYYY-MM-DD string with the current time in the target timezone
  const combineDateWithCurrentTime = useCallback(
    (dateStr) => {
      if (!dateStr) return null;
      const targetTz = config.timezone || "Europe/Madrid";

      // 1. Get current time parts in target timezone
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: targetTz,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      const nowInTz = formatter.format(now); // "HH:mm:ss"

      // 2. Create a Date object representing that time in the target timezone
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
        {}
      );
      const dateFormatted = `${p.year}-${p.month.padStart(
        2,
        "0"
      )}-${p.day.padStart(2, "0")}T${p.hour.padStart(
        2,
        "0"
      )}:${p.minute.padStart(2, "0")}:${p.second.padStart(2, "0")}`;

      const diff = temp.getTime() - new Date(dateFormatted).getTime();
      return new Date(temp.getTime() + diff).toISOString();
    },
    [config.timezone]
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
    serie: "P2025",
    budgetNumber: "",
    client: "",
    clientName: "", // Temporary for searching
    services: [],
    totalAmount: 0,
    status: "Draft",
    date: "",
    dueDate: "",
    paymentTerms: "1 day",
    paymentTermsManual: "",
  });

  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientMode, setClientMode] = useState("existing"); // 'existing' | 'new'
  const [newClientData, setNewClientData] = useState({
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

  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await api.get("/clients?limit=100");
        setClients(response.data.clients);
      } catch (err) {
        console.error("Error fetching clients:", err);
      }
    };
    fetchClients();
  }, []);

  // Reactive initialization for NEW budgets
  useEffect(() => {
    if (
      !isEditMode &&
      config.timezone &&
      (!formData.date || !formData.dueDate)
    ) {
      const today = getTodayStr();
      setFormData((prev) => ({
        ...prev,
        date: prev.date || today,
        dueDate: prev.dueDate || today,
      }));
    }
  }, [
    config.timezone,
    isEditMode,
    formData.date,
    formData.dueDate,
    getTodayStr,
  ]);

  useEffect(() => {
    const fetchBudget = async () => {
      if (!isEditMode) {
        try {
          // Fetch next number if a serie is selected
          if (formData.serie) {
            const res = await api.get(
              `/budgets/next-number?serie=${formData.serie}`
            );
            setFormData((prev) => ({
              ...prev,
              budgetNumber: res.data.nextNumber,
            }));
          }
        } catch (err) {
          console.error("Error fetching next budget number:", err);
        }
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.get(`/budgets/${id}`);
        const budget = response.data;
        const formatDate = (date) => {
          if (!date) return "";
          return new Intl.DateTimeFormat("en-CA", {
            timeZone: config.timezone || "Europe/Madrid",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(date));
        };

        const formattedDate = formatDate(budget.date);
        const formattedDueDate = formatDate(budget.dueDate);

        setFormData({
          ...budget,
          date: formattedDate || getTodayStr(),
          dueDate: formattedDueDate || getTodayStr(),
          client: budget.client?._id || budget.client || "",
          clientName: budget.client?.name || "",
          paymentTerms: budget.paymentTerms || "1 day",
          paymentTermsManual: budget.paymentTermsManual || "",
        });

        if (budget.client) setClientMode("existing");
      } catch (err) {
        console.error("Error fetching budget:", err);
        showNotification(t("error"), "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBudget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode, formData.serie]);

  useEffect(() => {
    const total = formData.services.reduce((acc, service) => {
      const base = parseFloat(service.taxBase) || 0;
      const quantity = parseFloat(service.quantity) || 0;
      const discount = parseFloat(service.discount) || 0;
      const ivaPercent = parseFloat(service.iva) || 0;

      const subtotal = base * quantity;
      const discountAmount = subtotal * (discount / 100);
      const taxableAmount = subtotal - discountAmount;
      const ivaAmount = taxableAmount * (ivaPercent / 100);

      return acc + taxableAmount + ivaAmount;
    }, 0);
    setFormData((prev) => ({
      ...prev,
      totalAmount: parseFloat(total.toFixed(2)),
    }));
  }, [formData.services]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTermChange = (e) => {
    const term = e.target.value;

    let newDueDate = formData.dueDate;
    if (term !== "Manual" && term !== "custom") {
      const days = parseInt(term.split(" ")[0]);
      const baseDate = formData.date ? new Date(formData.date) : new Date();
      if (!isNaN(days)) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + days);
        newDueDate = d.toISOString().split("T")[0];
      }
    }

    setFormData((prev) => ({
      ...prev,
      paymentTerms: term,
      dueDate: newDueDate,
    }));
  };

  const handleClientNameChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, clientName: value, client: "" });
    setIsClientDropdownOpen(true);
    if (value) {
      const filtered = clients.filter((client) =>
        client.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients([]);
    }
  };

  const selectClient = (client) => {
    // Determine payment terms: use client's terms or default to '1 day'
    const paymentTerms = client.paymentTerms || "1 day";
    const paymentTermsManual = client.paymentTermsManual || "";

    // Calculate new due date based on client's payment terms
    let newDueDate = formData.dueDate;
    if (paymentTerms !== "Manual") {
      const days = parseInt(paymentTerms.split(" ")[0]);
      const baseDate = formData.date ? new Date(formData.date) : new Date();
      if (!isNaN(days)) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + days);
        newDueDate = d.toISOString().split("T")[0];
      }
    }

    setFormData({
      ...formData,
      client: client._id,
      clientName: client.name,
      paymentTerms: paymentTerms,
      paymentTermsManual: paymentTermsManual,
      dueDate: newDueDate,
    });
    setIsClientDropdownOpen(false);
  };

  const handleNewClientChange = (e) => {
    const { name, value } = e.target;
    setNewClientData({ ...newClientData, [name]: value });

    // Real-time sync: if user changes payment terms for new client, update budget terms too
    if (name === "paymentTerms" || name === "paymentTermsManual") {
      let newDueDate = formData.dueDate;
      if (name === "paymentTerms" && value !== "Manual" && value !== "custom") {
        const days = parseInt(value.split(" ")[0]);
        const baseDate = formData.date ? new Date(formData.date) : new Date();
        if (!isNaN(days)) {
          const d = new Date(baseDate);
          d.setDate(d.getDate() + days);
          newDueDate = d.toISOString().split("T")[0];
        }
      }

      setFormData((prev) => ({
        ...prev,
        [name]: value,
        dueDate: newDueDate,
      }));
    }
  };

  const getSelectedClientDetails = () => {
    if (!formData.client) return null;
    return clients.find((c) => c._id === formData.client);
  };

  const handleServiceChange = (index, e) => {
    const { name, value } = e.target;
    const newServices = [...formData.services];
    newServices[index][name] = value;
    setFormData({ ...formData, services: newServices });
  };

  const addService = () => {
    setFormData({
      ...formData,
      services: [
        ...formData.services,
        { concept: "", quantity: 1, taxBase: 0, discount: 0, iva: 21 },
      ],
    });
  };

  const removeService = (index) => {
    const newServices = formData.services.filter((_, i) => i !== index);
    setFormData({ ...formData, services: newServices });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (formData.status !== "Draft" && formData.services.length === 0) {
      setFormError(t("noServicesError") || "Add at least one service.");
      return;
    }

    let finalFormData = {
      ...formData,
      client: formData.client || null,
    };

    if (clientMode === "new") {
      if (!newClientData.name || !newClientData.nif) {
        setFormError("Client Name and NIF are required.");
        return;
      }
      try {
        const clientRes = await api.post("/clients", newClientData);
        const newClient = clientRes.data;
        setClients([...clients, newClient]);
        finalFormData.client = newClient._id;

        // Use new client's terms for the budget
        finalFormData.paymentTerms = newClient.paymentTerms || "1 day";
        finalFormData.paymentTermsManual = newClient.paymentTermsManual || "";
      } catch (err) {
        console.error("Error creating new client:", err);
        setFormError(
          "Error creating new client: " +
            (err.response?.data?.message || err.message)
        );
        return;
      }
    }

    const payload = {
      ...finalFormData,
      date: combineDateWithCurrentTime(finalFormData.date || getTodayStr()),
      dueDate: combineDateWithCurrentTime(
        finalFormData.dueDate || getTodayStr()
      ),
    };

    try {
      if (isEditMode) {
        await api.put(`/budgets/${id}`, payload);
      } else {
        await api.post("/budgets", payload);
      }
      showNotification(t("changesSaved"), "success");
      navigate("/budgets");
    } catch (err) {
      console.error("Error saving budget:", err);
      setFormError(err.response?.data?.message || err.message);
    }
  };

  if (isLoading && isEditMode)
    return <div className="container">{t("loading")}</div>;

  return (
    <div style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
      <div
        className="flex justify-between items-center"
        style={{ marginBottom: "1.5rem" }}
      >
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600" }}>
          {isEditMode ? t("editBudget") : t("newBudget")}
        </h2>
        <button
          onClick={() => navigate("/budgets")}
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
              marginBottom: "1.5rem",
            }}
          >
            {/* Client Section First */}
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
                  onClick={() => setClientMode("existing")}
                  style={{
                    background: "none",
                    border: "none",
                    borderBottom:
                      clientMode === "existing"
                        ? "2px solid #6366f1"
                        : "2px solid transparent",
                    color: clientMode === "existing" ? "#6366f1" : "#64748b",
                    fontWeight: "600",
                    padding: "0.5rem 0",
                    cursor: "pointer",
                  }}
                >
                  {t("chooseExistingClient")}
                </button>
                <button
                  type="button"
                  onClick={() => setClientMode("new")}
                  style={{
                    background: "none",
                    border: "none",
                    borderBottom:
                      clientMode === "new"
                        ? "2px solid #6366f1"
                        : "2px solid transparent",
                    color: clientMode === "new" ? "#6366f1" : "#64748b",
                    fontWeight: "600",
                    padding: "0.5rem 0",
                    cursor: "pointer",
                  }}
                >
                  + {t("createNewClient")}
                </button>
              </div>

              {clientMode === "existing" ? (
                <div style={{ position: "relative" }}>
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
                    onChange={handleClientNameChange}
                    onFocus={() => {
                      if (clients.length > 0) {
                        setFilteredClients(clients);
                        setIsClientDropdownOpen(true);
                      }
                    }}
                    onBlur={() =>
                      setTimeout(() => setIsClientDropdownOpen(false), 200)
                    }
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #cbd5e1",
                    }}
                    placeholder={t("placeholderClient")}
                    autoComplete="off"
                    required={
                      formData.status !== "Draft" && clientMode === "existing"
                    }
                  />
                  {isClientDropdownOpen && filteredClients.length > 0 && (
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
                      {filteredClients.map((client) => (
                        <li
                          key={client._id}
                          onClick={() => selectClient(client)}
                          style={{
                            padding: "0.5rem",
                            cursor: "pointer",
                            borderBottom: "1px solid #f1f5f9",
                          }}
                          className="hover:bg-gray-50"
                        >
                          <div style={{ fontWeight: "500" }}>{client.name}</div>
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            {client.nif}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {getSelectedClientDetails() && (
                    <div
                      style={{
                        marginTop: "1rem",
                        padding: "1rem",
                        backgroundColor: "#f8fafc",
                        borderRadius: "0.5rem",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div style={{ fontWeight: "600" }}>
                        {getSelectedClientDetails().name}
                      </div>
                      <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                        NIF: {getSelectedClientDetails().nif}
                      </div>
                      <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                        {getSelectedClientDetails().address}
                      </div>
                    </div>
                  )}
                </div>
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
                      value={newClientData.name}
                      onChange={handleNewClientChange}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        borderRadius: "0.375rem",
                        border: "1px solid #cbd5e1",
                      }}
                      required={
                        formData.status !== "Draft" && clientMode === "new"
                      }
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
                      name="nif"
                      value={newClientData.nif}
                      onChange={handleNewClientChange}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        borderRadius: "0.375rem",
                        border: "1px solid #cbd5e1",
                      }}
                      required={
                        formData.status !== "Draft" && clientMode === "new"
                      }
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
                      {t("address")}
                    </label>
                    <textarea
                      name="address"
                      value={newClientData.address}
                      onChange={handleNewClientChange}
                      rows="1"
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        borderRadius: "0.375rem",
                        border: "1px solid #cbd5e1",
                        fontFamily: "inherit",
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
                      {t("postalCode")}
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={newClientData.postalCode}
                      onChange={handleNewClientChange}
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
                      {t("city")}
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={newClientData.city}
                      onChange={handleNewClientChange}
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
                      {t("province")}
                    </label>
                    <input
                      type="text"
                      name="province"
                      value={newClientData.province}
                      onChange={handleNewClientChange}
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
                      {t("country")}
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={newClientData.country}
                      onChange={handleNewClientChange}
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
                      {t("email")}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={newClientData.email}
                      onChange={handleNewClientChange}
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
                      {t("phone")}
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={newClientData.phone}
                      onChange={handleNewClientChange}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        borderRadius: "0.375rem",
                        border: "1px solid #cbd5e1",
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
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
                      value={newClientData.paymentMethod}
                      onChange={handleNewClientChange}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        borderRadius: "0.375rem",
                        border: "1px solid #cbd5e1",
                      }}
                    >
                      <option value="Transferencia">
                        {t("transfer") || "Transferencia"}
                      </option>
                      <option value="Efectivo">
                        {t("cash") || "Efectivo"}
                      </option>
                      <option value="Tarjeta">{t("card") || "Tarjeta"}</option>
                      <option value="Domiciliación bancaria">
                        {t("directDebit") || "Domiciliación bancaria"}
                      </option>
                    </select>
                  </div>

                  <div style={{ gridColumn: "span 2" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "500",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {t("paymentTerms")}
                    </label>
                    <select
                      name="paymentTerms"
                      value={newClientData.paymentTerms}
                      onChange={handleNewClientChange}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        borderRadius: "0.375rem",
                        border: "1px solid #cbd5e1",
                      }}
                    >
                      <option value="1 day">{t("1 day")}</option>
                      <option value="7 days">{t("7 days")}</option>
                      <option value="15 days">{t("15 days")}</option>
                      <option value="30 days">{t("30 days")}</option>
                      <option value="45 days">{t("45 days")}</option>
                      <option value="60 days">{t("60 days")}</option>
                      <option value="Manual">{t("Manual")}</option>
                    </select>
                  </div>

                  {newClientData.paymentTerms === "Manual" && (
                    <div style={{ gridColumn: "span 2" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "0.5rem",
                          fontWeight: "500",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {t("paymentTermsManualPlaceholder")}
                      </label>
                      <input
                        type="text"
                        name="paymentTermsManual"
                        value={newClientData.paymentTermsManual}
                        onChange={handleNewClientChange}
                        required={
                          formData.status !== "Draft" && clientMode === "new"
                        }
                        style={{
                          width: "100%",
                          padding: "0.5rem",
                          borderRadius: "0.375rem",
                          border: "1px solid #cbd5e1",
                        }}
                      />
                    </div>
                  )}
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
                disabled={formData.status === "Draft"}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #cbd5e1",
                  backgroundColor:
                    formData.status === "Draft" ? "#f3f4f6" : "white",
                  cursor:
                    formData.status === "Draft" ? "not-allowed" : "default",
                }}
              >
                <option value="P2025">P2025</option>
                <option value="P2026">P2026</option>
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
                {t("budgetNumber")}
              </label>
              <input
                type="number"
                name="budgetNumber"
                value={formData.budgetNumber}
                onChange={handleChange}
                required={formData.status !== "Draft"}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#f3f4f6",
                  cursor: "not-allowed",
                }}
                readOnly
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
                {t("paymentTerms")}
              </label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <select
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleTermChange}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "white",
                  }}
                >
                  <option value="1 day">1 {t("day")}</option>
                  <option value="7 days">7 {t("days")}</option>
                  <option value="15 days">15 {t("days")}</option>
                  <option value="30 days">30 {t("days")}</option>
                  <option value="45 days">45 {t("days")}</option>
                  <option value="60 days">60 {t("days")}</option>
                  <option value="Manual">{t("manual")}</option>
                </select>
                {formData.paymentTerms === "Manual" && (
                  <input
                    type="text"
                    name="paymentTermsManual"
                    value={formData.paymentTermsManual}
                    onChange={handleChange}
                    placeholder={t("paymentTermsManualPlaceholder")}
                    required={formData.status !== "Draft"}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #cbd5e1",
                    }}
                  />
                )}
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
                {t("dueDate")}
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required={formData.status !== "Draft"}
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
                <option value="Done">{t("statusDone")}</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
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
                className="btn btn-secondary btn-sm"
              >
                + {t("addService")}
              </button>
            </div>

            {formData.services.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "0.8fr 3.2fr 0.8fr 1.6fr 1fr 1fr 0.5fr",
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

            {formData.services.map((service, index) => (
              <div
                key={index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "0.8fr 3.2fr 0.8fr 1.6fr 1fr 1fr 0.5fr",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                  alignItems: "center",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "0.5rem",
                }}
              >
                <input
                  type="number"
                  name="number"
                  value={service.number || ""}
                  onChange={(e) => handleServiceChange(index, e)}
                  placeholder="Nº"
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                  }}
                />
                <input
                  type="text"
                  name="concept"
                  value={service.concept}
                  onChange={(e) => handleServiceChange(index, e)}
                  required={formData.status !== "Draft"}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                  }}
                />
                <input
                  type="number"
                  name="quantity"
                  value={service.quantity}
                  onChange={(e) => handleServiceChange(index, e)}
                  required={formData.status !== "Draft"}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                  }}
                />
                <input
                  type="number"
                  step="0.01"
                  name="taxBase"
                  value={service.taxBase}
                  onChange={(e) => handleServiceChange(index, e)}
                  required={formData.status !== "Draft"}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                  }}
                />
                <input
                  type="number"
                  step="0.01"
                  name="discount"
                  value={service.discount}
                  onChange={(e) => handleServiceChange(index, e)}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                  }}
                />
                <input
                  type="number"
                  step="0.01"
                  name="iva"
                  value={service.iva}
                  onChange={(e) => handleServiceChange(index, e)}
                  required={formData.status !== "Draft"}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                  }}
                />
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
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              borderTop: "1px solid #e2e8f0",
              paddingTop: "1.5rem",
            }}
          >
            <div style={{ width: "300px" }}>
              {(() => {
                const subtotal = formData.services.reduce(
                  (acc, s) =>
                    acc +
                    (parseFloat(s.taxBase) || 0) *
                      (parseFloat(s.quantity) || 1),
                  0
                );
                const discountTotal = formData.services.reduce((acc, s) => {
                  const base = parseFloat(s.taxBase) || 0;
                  const quantity = parseFloat(s.quantity) || 1;
                  const discount = parseFloat(s.discount) || 0;
                  return acc + base * quantity * (discount / 100);
                }, 0);
                const taxableBase = subtotal - discountTotal;
                const ivaTotal = formData.services.reduce((acc, s) => {
                  const base = parseFloat(s.taxBase) || 0;
                  const quantity = parseFloat(s.quantity) || 1;
                  const discount = parseFloat(s.discount) || 0;
                  const iva = parseFloat(s.iva) || 0;
                  return (
                    acc +
                    (base * quantity - base * quantity * (discount / 100)) *
                      (iva / 100)
                  );
                }, 0);

                return (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.9rem",
                        color: "#64748b",
                      }}
                    >
                      <span>{t("subtotal")}:</span>
                      <span>€{subtotal.toFixed(2)}</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.9rem",
                        color: "#64748b",
                      }}
                    >
                      <span>{t("discount")}:</span>
                      <span>-€{discountTotal.toFixed(2)}</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.9rem",
                        color: "#1e293b",
                        fontWeight: "600",
                      }}
                    >
                      <span>{t("taxBase")}:</span>
                      <span>€{taxableBase.toFixed(2)}</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.9rem",
                        color: "#64748b",
                      }}
                    >
                      <span>IVA %:</span>
                      <span>€{ivaTotal.toFixed(2)}</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "1.25rem",
                        fontWeight: "700",
                        color: "var(--color-primary)",
                        borderTop: "2px solid #e2e8f0",
                        marginTop: "0.5rem",
                        paddingTop: "0.5rem",
                      }}
                    >
                      <span>Total:</span>
                      <span>€{formData.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <div style={{ marginTop: "2rem" }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: "0.75rem" }}
            >
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetForm;
