import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { useLanguage } from "../context/LanguageContext";
import { useConfig } from "../context/ConfigContext";
import { useNotification } from "../context/NotificationContext";

const AlbaranForm = () => {
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
    serie: "AL2025",
    AlbaranNumber: "",
    client: "",
    clientName: "",
    services: [],
    status: "Draft",
    orderNumber: "",
    ourDocumentNumber: "",
    date: "",
  });

  // Reactive initialization for NEW albaranes
  useEffect(() => {
    if (!isEditMode && config.timezone && !formData.date) {
      const today = getTodayStr();
      setFormData((prev) => ({
        ...prev,
        date: prev.date || today,
      }));
    }
  }, [config.timezone, isEditMode, formData.date, getTodayStr]);

  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientMode, setClientMode] = useState("existing");
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

  useEffect(() => {
    const fetchAlbaran = async () => {
      if (!isEditMode) {
        try {
          if (formData.serie) {
            const res = await api.get(
              `/albaranes/next-number?serie=${formData.serie}`
            );
            setFormData((prev) => ({
              ...prev,
              AlbaranNumber: res.data.nextNumber,
            }));
          }
        } catch (err) {
          console.error("Error fetching next albaran number:", err);
        }
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.get(`/albaranes/${id}`);
        const albaran = response.data;
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
          ...albaran,
          date: formatDate(albaran.date) || getTodayStr(),
          client: albaran.client?._id || albaran.client || "",
          clientName: albaran.client?.name || "",
        });

        if (albaran.client) setClientMode("existing");
      } catch (err) {
        console.error("Error fetching albaran:", err);
        showNotification(t("error"), "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlbaran();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode, formData.serie]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
    setFormData({
      ...formData,
      client: client._id,
      clientName: client.name,
    });
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
    setFormData({ ...formData, services: newServices });
  };

  const addService = () => {
    const lastNumber =
      formData.services.length > 0
        ? Math.max(...formData.services.map((s) => parseInt(s.number) || 0))
        : 0;

    setFormData({
      ...formData,
      services: [
        ...formData.services,
        { concept: "", quantity: 1, number: lastNumber + 1 },
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
    };

    try {
      if (isEditMode) {
        await api.put(`/albaranes/${id}`, payload);
      } else {
        await api.post("/albaranes", payload);
      }
      showNotification(t("changesSaved"), "success");
      navigate("/albaranes");
    } catch (err) {
      console.error("Error saving albaran:", err);
      setFormError(err.response?.data?.message || err.message);
    }
  };

  if (isLoading && isEditMode)
    return <div className="container">{t("loading")}</div>;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <div
        className="flex justify-between items-center"
        style={{ marginBottom: "1.5rem" }}
      >
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600" }}>
          {isEditMode ? t("editAlbaran") : t("newAlbaran")}
        </h2>
        <button
          onClick={() => navigate("/albaranes")}
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
            {/* Client Section */}
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
                  }}
                >
                  {/* ... Same as BudgetForm new client fields ... */}
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
                      rows="2"
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
                  backgroundColor: "white",
                }}
              >
                <option value="AL2025">AL2025</option>
                <option value="AL2026">AL2026</option>
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
                {t("albaranNumber")}
              </label>
              <input
                type="number"
                name="AlbaranNumber"
                value={formData.AlbaranNumber}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#f3f4f6",
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
                {t("date")}
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #cbd5e1",
                }}
                required
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

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                  color: "var(--color-text-secondary)",
                }}
              >
                {t("orderNumber")}
              </label>
              <input
                type="text"
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleChange}
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
                {t("ourDocumentNumber")}
              </label>
              <input
                type="text"
                name="ourDocumentNumber"
                value={formData.ourDocumentNumber}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #cbd5e1",
                }}
              />
            </div>
          </div>

          {/* Services Section */}
          <div style={{ marginTop: "2rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                paddingBottom: "0.5rem",
                borderBottom: "2px solid #f1f5f9",
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
                + {t("addService") || "Add Service"}
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "80px 100px 1fr 50px",
                gap: "1rem",
                marginBottom: "0.5rem",
                padding: "0 0.5rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  color: "#64748b",
                }}
              >
                Nº
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  color: "#64748b",
                }}
              >
                {t("quantity")}
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  color: "#64748b",
                }}
              >
                {t("description")}
              </div>
              <div></div>
            </div>

            {formData.services.map((service, index) => (
              <div
                key={index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 100px 1fr 50px",
                  gap: "1rem",
                  marginBottom: "1rem",
                  alignItems: "start",
                  backgroundColor: "#f8fafc",
                  padding: "1rem",
                  borderRadius: "0.5rem",
                }}
              >
                <input
                  type="number"
                  name="number"
                  value={service.number}
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
                  name="quantity"
                  value={service.quantity}
                  onChange={(e) => handleServiceChange(index, e)}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                  }}
                  required
                />
                <textarea
                  name="concept"
                  value={service.concept}
                  onChange={(e) => handleServiceChange(index, e)}
                  rows="2"
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                    fontFamily: "inherit",
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => removeService(index)}
                  style={{
                    padding: "0.5rem",
                    color: "#ef4444",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    marginTop: "0.25rem",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "2rem" }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: "0.75rem" }}
            >
              {isEditMode ? t("updateAlbaran") : t("createAlbaran")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AlbaranForm;
