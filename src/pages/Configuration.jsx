import { useState, useEffect } from "react";
import { useConfig } from "../context/ConfigContext";
import { useLanguage } from "../context/LanguageContext";
import { useNotification } from "../context/NotificationContext";

const Configuration = () => {
  const { config, updateConfig, loading } = useConfig();
  const { t } = useLanguage();
  const { showNotification } = useNotification();
  const [timezone, setTimezone] = useState("Europe/Madrid");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (config?.timezone && config.timezone !== timezone) {
      setTimezone(config.timezone);
    }
  }, [config, timezone]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const result = await updateConfig({ timezone });
    setIsSaving(false);

    if (result.success) {
      showNotification(t("changesSaved"), "success");
    } else {
      showNotification(t("error"), "error");
    }
  };

  if (loading) return <div style={{ padding: "2rem" }}>{t("loading")}</div>;

  // List of common timezones (simplified list)
  const timezones = [
    { label: "Madrid (Spain)", value: "Europe/Madrid" },
    { label: "London (UK)", value: "Europe/London" },
    { label: "Paris (France)", value: "Europe/Paris" },
    { label: "New York (USA)", value: "America/New_York" },
    { label: "Los Angeles (USA)", value: "America/Los_Angeles" },
    { label: "Tokyo (Japan)", value: "Asia/Tokyo" },
    { label: "Sydney (Australia)", value: "Australia/Sydney" },
    { label: "UTC", value: "UTC" },
  ];

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
        }}
      >
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "600",
                color: "var(--color-text-primary)",
              }}
            >
              {t("timezone") || "System Timezone"}
            </label>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-secondary)",
                marginBottom: "1rem",
              }}
            >
              {t("timezoneDescription") ||
                "This timezone will be used for all dates displayed in the system and generated PDFs."}
            </p>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              style={{
                width: "100%",
                maxWidth: "400px",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--color-border)",
                fontSize: "1rem",
              }}
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
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
            {isSaving ? t("saving") : t("save")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Configuration;
