import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../api/axios";
import { useLanguage } from "../context/LanguageContext";
import { useConfig } from "../context/ConfigContext";

const InvoiceForm = () => {
  const { t } = useLanguage();
  const { config } = useConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isRectifyMode = location.pathname.endsWith("/rectify");
  const isEditMode = !!id && !isRectifyMode;

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
      // We can use the dateStr + time + offset, but finding the offset is tricky.
      // Safest way: Create local date, format it to see the shift, and adjust.
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
    serie: location.pathname.endsWith("/rectify") ? "R2025" : "A2025",
    type: location.pathname.endsWith("/rectify") ? "R1" : "F1",
    invoiceNumber: "",
    clientName: "",
    clientNIF: "",
    client: "",
    services: [],
    totalAmount: 0,
    status: "Pending",
    date: "",
    dueDate: "",
    externalDocumentNumber: "",
  });

  // Reactive initialization for NEW invoices
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
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [paymentTerm, setPaymentTerm] = useState("custom");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);

  // New State for Client Mode
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
  });

  const fetchInvoice = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/invoices/${id}`);
      const invoice = response.data;
      // Format date for input type="date" using Madrid timezone
      const formatDate = (date) => {
        if (!date) return "";
        return new Intl.DateTimeFormat("en-CA", {
          timeZone: config.timezone || "Europe/Madrid",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(date));
      };

      const formattedDate = formatDate(invoice.date);
      const formattedDueDate = formatDate(invoice.dueDate);
      const updatedInvoice = {
        ...invoice,
        serie: isRectifyMode ? "R2025" : invoice.serie || "A2025", // Force R series for rectification, default A2025 for drafts
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
      };

      setFormData(updatedInvoice);

      // Select the client if it exists
      if (invoice.client) {
        setClientMode("existing");
      }

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
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching invoice:", err);
      setError(t("error"));
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if we are in "edit" mode but the ID is "new"
    const isValidObjectId = (str) => /^[0-9a-fA-F]{24}$/.test(str);
    if (id && isValidObjectId(id)) {
      fetchInvoice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  // Auto-fetch next number when series changes
  useEffect(() => {
    const fetchNextNumber = async () => {
      const isValidObjectId = (str) => /^[0-9a-fA-F]{24}$/.test(str);
      const isNewInvoice = !id || !isValidObjectId(id);

      if (!isNewInvoice && formData.invoiceNumber) {
        return;
      }

      if (!formData.serie) return;

      if (formData.status === "Draft") {
        return;
      }

      try {
        const response = await api.get(
          `/invoices/next-number?serie=${formData.serie}`
        );
        setFormData((prev) => ({
          ...prev,
          invoiceNumber: response.data.nextNumber,
        }));
      } catch (err) {
        console.error("Error fetching next number:", err);
      }
    };

    if (
      formData.serie &&
      !formData.invoiceNumber &&
      formData.status !== "Draft"
    ) {
      fetchNextNumber();
    }
  }, [formData.serie, formData.status, formData.invoiceNumber, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    // Automatic date assignment when promoting from Draft
    if (name === "status" && formData.status === "Draft" && value !== "Draft") {
      if (!formData.date) {
        newFormData.date = getTodayStr();
      }
    }

    // Clear invoice number if moving TO draft (optional, user preference often)
    if (name === "status" && value === "Draft") {
      newFormData.invoiceNumber = "";
    }

    setFormData(newFormData);
    if (formError) setFormError(null);
  };

  // --- Client Handling ---

  const handleClientNameChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, clientName: value, client: "" }); // Clear linked client if manually typing
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
    setFormData({
      ...formData,
      client: client._id,
      clientName: client.name,
      clientNIF: client.nif,
      // Optional: fill address/email if you added those fields to Invoice model (we didn't yet, but good for UI)
    });
    // We can store the full selected client object in a temp state to show the card details
    // But since `formData` only stores simple fields, let's use a helper or just rely on finding it in `clients`
    setIsClientDropdownOpen(false);
  };

  const handleNewClientChange = (e) => {
    setNewClientData({ ...newClientData, [e.target.name]: e.target.value });
  };

  const getSelectedClientDetails = () => {
    if (!formData.client) return null;
    return clients.find((c) => c._id === formData.client);
  };

  const handleServiceChange = (index, e) => {
    const { name, value } = e.target;
    const newServices = [...formData.services];
    newServices[index][name] = value;

    // Recalculate implicitly... actually we only set the raw value here.
    // The previous logic was setting 'iva' which was the calculated amount (absolute).
    // Now 'iva' is a percentage. And we need to store it as such.
    // The total calculation will happen in the effect.
    setFormData({ ...formData, services: newServices });
  };

  // Recalculate total whenever services change
  // Recalculate total whenever services change
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
    const newTotal = newServices.reduce((acc, service) => {
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
    setFormError(null);

    // Validation
    if (formData.status !== "Draft") {
      if (!formData.serie) {
        setFormError(t("serie") + " is required for non-draft invoices.");
        return;
      }
      if (!formData.invoiceNumber) {
        setFormError(
          t("invoiceNumber") + " is required for non-draft invoices."
        );
        return;
      }
    }

    // Client Validation
    // For F1 invoices or any non-draft that requires client details
    if (formData.type !== "F2" && formData.status !== "Draft") {
      if (clientMode === "existing" && !formData.clientName) {
        setFormError(t("clientName") + " is required.");
        return;
      }
      if (clientMode === "new") {
        if (!newClientData.name || !newClientData.nif) {
          setFormError("New Client Name and NIF are required.");
          return;
        }
      }
    }

    let finalFormData = { ...formData };

    // If creating a new client
    if (
      clientMode === "new" &&
      (formData.type !== "F2" || newClientData.name)
    ) {
      try {
        const clientRes = await api.post("/clients", newClientData);
        const newClient = clientRes.data;

        // Add to local list so we don't have to refetch
        setClients([...clients, newClient]);

        // Link to invoice
        finalFormData.client = newClient._id;
        // Also populate the snapshot fields
        finalFormData.clientName = newClient.name;
        finalFormData.clientNIF = newClient.nif;
      } catch (err) {
        console.error("Error creating new client:", err);
        setFormError(
          "Error creating new client: " +
            (err.response?.data?.message || err.message)
        );
        return;
      }
    } else if (clientMode === "existing") {
      // If the user typed a name that isn't in the list (so no ID), we just save the name/NIF snapshots
      // and set client to null.
      if (!finalFormData.client) {
        finalFormData.client = null;
      }
    }

    // Backend validation: 'client' must be ObjectId or null/undefined. It cannot be "".
    if (finalFormData.client === "") {
      finalFormData.client = null;
    }

    try {
      const dataToUse = {
        ...finalFormData,
        dueDate: combineDateWithCurrentTime(finalFormData.dueDate),
      };

      if (isRectifyMode) {
        delete dataToUse._id;
      } else if (finalFormData.status === "Draft") {
        delete dataToUse.date;
        delete dataToUse.invoiceNumber;
        delete dataToUse.serie;
      }

      const payload = {
        ...dataToUse,
        //date: combineDateWithCurrentTime(formData.date || getTodayStr()),
      };

      if (isEditMode) {
        await api.put(`/invoices/${id}`, payload);
      } else {
        await api.post("/invoices", payload);
      }
      navigate("/invoices");
    } catch (err) {
      console.error("Error saving invoice:", err);
      // Improve error display
      const msg = err.response?.data?.message || err.message;
      setFormError(msg);
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
                  <input
                    type="text"
                    name="rectifyReason"
                    value={formData.rectifyReason || ""}
                    onChange={handleChange}
                    required
                    placeholder={
                      t("rectifyReason") || "Reason for rectification"
                    }
                    style={{
                      padding: "0.5rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #cbd5e1",
                    }}
                  />
                </div>
              </>
            )}
            {formData.type !== "F2" && (
              <>
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
                        color:
                          clientMode === "existing" ? "#6366f1" : "#64748b",
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
                    <>
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
                      <div
                        style={{ position: "relative", marginBottom: "1rem" }}
                      >
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
                            setTimeout(
                              () => setIsClientDropdownOpen(false),
                              200
                            )
                          }
                          required={
                            formData.type !== "F2" &&
                            formData.status !== "Draft" &&
                            clientMode === "existing"
                          }
                          style={{
                            fontSize: "1rem",
                            width: "100%",
                            padding: "0.5rem",
                            borderRadius: "0.375rem",
                            border: "1px solid #cbd5e1",
                          }}
                          placeholder={t("placeholderClient")}
                          autoComplete="off"
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
                                <div style={{ fontWeight: "500" }}>
                                  {client.name}
                                </div>
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
                      </div>

                      {getSelectedClientDetails() && (
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
                            {getSelectedClientDetails().name}
                          </h4>
                          {getSelectedClientDetails().email && (
                            <div
                              style={{ fontSize: "0.9rem", color: "#64748b" }}
                            >
                              {getSelectedClientDetails().email}
                            </div>
                          )}
                          <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                            NIF: {getSelectedClientDetails().nif}
                          </div>
                          {getSelectedClientDetails().phone && (
                            <div
                              style={{ fontSize: "0.9rem", color: "#64748b" }}
                            >
                              {t("phone")}: {getSelectedClientDetails().phone}
                            </div>
                          )}
                          {getSelectedClientDetails().address && (
                            <div
                              style={{ fontSize: "0.9rem", color: "#64748b" }}
                            >
                              {[
                                getSelectedClientDetails().address,
                                getSelectedClientDetails().postalCode,
                                getSelectedClientDetails().city,
                                getSelectedClientDetails().country,
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
                          value={newClientData.name}
                          onChange={handleNewClientChange}
                          required={clientMode === "new"}
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
                          {t("clientNIF")}
                        </label>
                        <input
                          type="text"
                          name="nif"
                          value={newClientData.nif}
                          onChange={handleNewClientChange}
                          required={clientMode === "new"}
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
                          {t("email")}
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={newClientData.email}
                          onChange={handleNewClientChange}
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
                          value={newClientData.phone}
                          onChange={handleNewClientChange}
                          style={{
                            fontSize: "1rem",
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
                          {t("address")}
                        </label>
                        <textarea
                          name="address"
                          value={newClientData.address}
                          onChange={handleNewClientChange}
                          rows="2"
                          style={{
                            fontSize: "1rem",
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
                          {t("city")}
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={newClientData.city}
                          onChange={handleNewClientChange}
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
                          {t("province")}
                        </label>
                        <input
                          type="text"
                          name="province"
                          value={newClientData.province}
                          onChange={handleNewClientChange}
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
                          {t("country")}
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={newClientData.country}
                          onChange={handleNewClientChange}
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
                disabled={formData.status === "Draft"}
                style={{
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #cbd5e1",
                  backgroundColor:
                    formData.status === "Draft" ? "#f3f4f6" : "white",
                  cursor:
                    formData.status === "Draft" ? "not-allowed" : "default",
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
                required={formData.status !== "Draft"}
                disabled={formData.status === "Draft"}
                readOnly
                placeholder={
                  formData.status === "Draft" ? "-" : t("placeholderInvoice")
                }
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
                {t("externalDocumentNumber") || "External Document #"}
              </label>
              <input
                type="text"
                name="externalDocumentNumber"
                value={formData.externalDocumentNumber || ""}
                onChange={handleChange}
                placeholder="000000"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #cbd5e1",
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
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                  borderBottom: "1px solid #e2e8f0",
                  paddingBottom: "1rem",
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

              {formData.services.map((service, index) => (
                <div
                  key={index}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "0.8fr 3.2fr 0.8fr 1.6fr 1fr 1fr 0.5fr",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                    paddingBottom: "1rem",
                    borderBottom: "1px solid #f1f5f9",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <input
                      type="number"
                      name="number"
                      value={service.number || ""}
                      onChange={(e) => handleServiceChange(index, e)}
                      placeholder="Nº"
                      style={{ width: "100%" }}
                    />
                  </div>
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
                      name="discount"
                      value={service.discount}
                      onChange={(e) => handleServiceChange(index, e)}
                      placeholder={t("discount")}
                      step="0.01"
                      min="0"
                      max="100"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      name="iva"
                      value={service.iva}
                      onChange={(e) => handleServiceChange(index, e)}
                      placeholder={t("iva")}
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      style={{ width: "100%" }}
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

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                borderTop: "1px solid #e2e8f0",
                paddingTop: "1.5rem",
                gridColumn: "1 / -1",
              }}
            >
              <div style={{ width: "350px" }}>
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
                    const ivaPercent = parseFloat(s.iva) || 0;
                    const lineSubtotal = base * quantity;
                    const lineTaxable =
                      lineSubtotal - lineSubtotal * (discount / 100);
                    return acc + lineTaxable * (ivaPercent / 100);
                  }, 0);

                  return (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      {discountTotal > 0 && (
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
                      )}
                      {discountTotal > 0 && (
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
                      )}
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
          </div>

          <div style={{ marginTop: "2rem" }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: "0.75rem" }}
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
