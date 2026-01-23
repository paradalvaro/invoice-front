import { useState, useEffect } from "react";
import { useConfig } from "../context/ConfigContext";
import { useLanguage } from "../context/LanguageContext";
import { useNotification } from "../context/NotificationContext";

const Configuration = () => {
  const { config, updateConfig, loading } = useConfig();
  const { t } = useLanguage();
  const { showNotification } = useNotification();
  const [timezone, setTimezone] = useState(config?.timezone || "Europe/Madrid");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState("invoices");
  const [newSerie, setNewSerie] = useState("");
  const [logo, setLogo] = useState(config?.logo || "");
  const [company, setCompany] = useState(config?.company || {});
  const [registry, setRegistry] = useState(config?.registry || {});
  const [bank, setBank] = useState(config?.bank || {});

  // Update local timezone and logo state when config loads
  useEffect(() => {
    if (config?.timezone) {
      setTimezone(config.timezone);
    }
    if (config?.logo) {
      setLogo(config.logo);
    }
    if (config?.company) {
      setCompany(config.company);
    }
    if (config?.registry) {
      setRegistry(config.registry);
    }
    if (config?.bank) {
      setBank(config.bank);
    }
  }, [
    config?.timezone,
    config?.logo,
    config?.company,
    config?.registry,
    config?.bank,
  ]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const result = await updateConfig({
      timezone,
      logo,
      company,
      registry,
      bank,
    });
    setIsSaving(false);

    if (result.success) {
      showNotification(t("changesSaved"), "success");
    } else {
      showNotification(t("error"), "error");
    }
  };

  if (loading) return <div style={{ padding: "2rem" }}>{t("loading")}</div>;

  // List of common timezones (simplified list) - preserved for reference if needed
  /*const timezones = [
    { label: "Madrid (Spain)", value: "Europe/Madrid" },
    { label: "London (UK)", value: "Europe/London" },
    { label: "Paris (France)", value: "Europe/Paris" },
    { label: "New York (USA)", value: "America/New_York" },
    { label: "Los Angeles (USA)", value: "America/Los_Angeles" },
    { label: "Tokyo (Japan)", value: "Asia/Tokyo" },
    { label: "Sydney (Australia)", value: "Australia/Sydney" },
    { label: "UTC", value: "UTC" },
  ];*/

  const addSerie = () => {
    if (!newSerie.trim()) return;
    const series = config?.series || {
      invoices: [],
      albaranes: [],
      budgets: [],
      bills: [],
    };
    const schemaSeries = series[selectedSchema] || [];

    if (!schemaSeries.includes(newSerie.trim())) {
      const updatedSeries = {
        ...series,
        [selectedSchema]: [...schemaSeries, newSerie.trim()],
      };
      updateConfig({ timezone, series: updatedSeries });
      setNewSerie("");
    }
  };

  const removeSerie = (serie) => {
    const series = config?.series || {};
    const schemaSeries = series[selectedSchema] || [];
    const updatedSeries = {
      ...series,
      [selectedSchema]: schemaSeries.filter((s) => s !== serie),
    };
    updateConfig({ timezone, series: updatedSeries });
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px" }}>
      <h1
        style={{
          marginBottom: "2rem",
          fontSize: "1.875rem",
          fontWeight: "700",
        }}
      >
        {t("configuration") || "Configuration"}
      </h1>

      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "0.75rem",
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
          marginBottom: "2rem",
        }}
      >
        <form onSubmit={handleSave}>
          <div
            style={{
              marginBottom: "2rem",
              padding: "1.5rem",
              backgroundColor: "#f8fafc",
              borderRadius: "0.5rem",
              border: "1px solid var(--color-border)",
            }}
          >
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: "600",
                marginBottom: "1rem",
                color: "var(--color-primary)",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "0.5rem",
              }}
            >
              {t("companyLogo") || "Company Logo"}
            </h3>
            <div
              style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}
            >
              {logo && (
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    border: "1px solid var(--color-border)",
                    borderRadius: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    backgroundColor: "white",
                  }}
                >
                  <img
                    src={logo}
                    alt="Logo Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                  />
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ fontSize: "0.875rem" }}
                />
                {logo && (
                  <button
                    type="button"
                    onClick={() => setLogo("")}
                    style={{
                      width: "fit-content",
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.75rem",
                      color: "#ef4444",
                      background: "none",
                      border: "1px solid #ef4444",
                      borderRadius: "0.25rem",
                      cursor: "pointer",
                    }}
                  >
                    {t("removeLogo") || "Remove Logo"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              marginBottom: "2rem",
              padding: "1.5rem",
              backgroundColor: "#f8fafc",
              borderRadius: "0.5rem",
              border: "1px solid var(--color-border)",
            }}
          >
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: "600",
                marginBottom: "1.25rem",
                color: "var(--color-primary)",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "0.5rem",
              }}
            >
              {t("companyInfo")}
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  {t("companyName")}
                </label>
                <input
                  type="text"
                  value={company.name || ""}
                  onChange={(e) =>
                    setCompany({ ...company, name: e.target.value })
                  }
                  style={{
                    padding: "0.6rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  {t("companyNIF")}
                </label>
                <input
                  type="text"
                  value={company.nif || ""}
                  onChange={(e) =>
                    setCompany({ ...company, nif: e.target.value })
                  }
                  style={{
                    padding: "0.6rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                  gridColumn: "span 2",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  {t("companyAddress")}
                </label>
                <input
                  type="text"
                  value={company.address || ""}
                  onChange={(e) =>
                    setCompany({ ...company, address: e.target.value })
                  }
                  style={{
                    padding: "0.6rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  {t("companyPostCode")}
                </label>
                <input
                  type="text"
                  value={company.postalCode || ""}
                  onChange={(e) =>
                    setCompany({ ...company, postalCode: e.target.value })
                  }
                  style={{
                    padding: "0.6rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  {t("companyCity")}
                </label>
                <input
                  type="text"
                  value={company.city || ""}
                  onChange={(e) =>
                    setCompany({ ...company, city: e.target.value })
                  }
                  style={{
                    padding: "0.6rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  {t("companyProvince")}
                </label>
                <input
                  type="text"
                  value={company.province || ""}
                  onChange={(e) =>
                    setCompany({ ...company, province: e.target.value })
                  }
                  style={{
                    padding: "0.6rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  {t("companyCountry")}
                </label>
                <input
                  type="text"
                  value={company.country || ""}
                  onChange={(e) =>
                    setCompany({ ...company, country: e.target.value })
                  }
                  style={{
                    padding: "0.6rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  {t("companyEmail")}
                </label>
                <input
                  type="email"
                  value={company.email || ""}
                  onChange={(e) =>
                    setCompany({ ...company, email: e.target.value })
                  }
                  style={{
                    padding: "0.6rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  {t("companyUrl")}
                </label>
                <input
                  type="text"
                  value={company.url || ""}
                  onChange={(e) =>
                    setCompany({ ...company, url: e.target.value })
                  }
                  style={{
                    padding: "0.6rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              marginBottom: "2rem",
              padding: "1.5rem",
              backgroundColor: "#f8fafc",
              borderRadius: "0.5rem",
              border: "1px solid var(--color-border)",
            }}
          >
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: "600",
                marginBottom: "1.25rem",
                color: "var(--color-primary)",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "0.5rem",
              }}
            >
              {t("registryInfo")}
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  {t("registryTomo")}
                </label>
                <input
                  type="text"
                  value={registry.tomo || ""}
                  onChange={(e) =>
                    setRegistry({ ...registry, tomo: e.target.value })
                  }
                  style={{
                    padding: "0.6rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  {t("registryLibro")}
                </label>
                <input
                  type="text"
                  value={registry.libro || ""}
                  onChange={(e) =>
                    setRegistry({ ...registry, libro: e.target.value })
                  }
                  style={{
                    padding: "0.6rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  {t("registryFolio")}
                </label>
                <input
                  type="text"
                  value={registry.folio || ""}
                  onChange={(e) =>
                    setRegistry({ ...registry, folio: e.target.value })
                  }
                  style={{
                    padding: "0.6rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  {t("registrySeccion")}
                </label>
                <input
                  type="text"
                  value={registry.seccion || ""}
                  onChange={(e) =>
                    setRegistry({ ...registry, seccion: e.target.value })
                  }
                  style={{
                    padding: "0.6rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  {t("registryHoja")}
                </label>
                <input
                  type="text"
                  value={registry.hoja || ""}
                  onChange={(e) =>
                    setRegistry({ ...registry, hoja: e.target.value })
                  }
                  style={{
                    padding: "0.6rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  {t("registryInscripcion")}
                </label>
                <input
                  type="text"
                  value={registry.inscripcion || ""}
                  onChange={(e) =>
                    setRegistry({ ...registry, inscripcion: e.target.value })
                  }
                  style={{
                    padding: "0.6rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              marginBottom: "2rem",
              padding: "1.5rem",
              backgroundColor: "#f8fafc",
              borderRadius: "0.5rem",
              border: "1px solid var(--color-border)",
            }}
          >
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: "600",
                marginBottom: "1.25rem",
                color: "var(--color-primary)",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "0.5rem",
              }}
            >
              {t("bankInfo")}
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  {t("bankName")}
                </label>
                <input
                  type="text"
                  value={bank.name || ""}
                  onChange={(e) => setBank({ ...bank, name: e.target.value })}
                  style={{
                    padding: "0.6rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  {t("bankIBAN")}
                </label>
                <input
                  type="text"
                  value={bank.iban || ""}
                  onChange={(e) => setBank({ ...bank, iban: e.target.value })}
                  style={{
                    padding: "0.6rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  {t("bankSWIFT")}
                </label>
                <input
                  type="text"
                  value={bank.swift || ""}
                  onChange={(e) => setBank({ ...bank, swift: e.target.value })}
                  style={{
                    padding: "0.6rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            style={{
              backgroundColor: "var(--color-primary)",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              border: "none",
              fontWeight: "600",
              cursor: isSaving ? "not-allowed" : "pointer",
              transition: "opacity 0.2s ease",
            }}
          >
            {isSaving ? t("saving") : t("saveChanges")}
          </button>
        </form>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "0.75rem",
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "700",
            marginBottom: "1.5rem",
          }}
        >
          {t("seriesManagement")}
        </h2>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "600",
              }}
            >
              {t("selectSchema")}
            </label>
            <select
              value={selectedSchema}
              onChange={(e) => setSelectedSchema(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem",
                borderRadius: "0.375rem",
                border: "1px solid var(--color-border)",
              }}
            >
              <option value="invoices">{t("invocies")}</option>
              <option value="albaranes">{t("albaranes")}</option>
              <option value="budgets">{t("budgets")}</option>
              <option value="bills">{t("bills")}</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "600",
              }}
            >
              {t("addSerie")}
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                value={newSerie}
                onChange={(e) => setNewSerie(e.target.value)}
                placeholder={t("newSerieValue")}
                style={{
                  flex: 1,
                  padding: "0.6rem",
                  borderRadius: "0.375rem",
                  border: "1px solid var(--color-border)",
                }}
              />
              <button
                onClick={addSerie}
                className="btn btn-primary"
                style={{ padding: "0.6rem 1rem" }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: "600",
              marginBottom: "1rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {t("existingSeries")}
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {config?.series?.[selectedSchema]?.map((serie) => (
              <div
                key={serie}
                style={{
                  backgroundColor: "#f1f5f9",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                }}
              >
                {serie}
                <button
                  onClick={() => removeSerie(serie)}
                  style={{
                    border: "none",
                    background: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    lineHeight: 1,
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuration;
