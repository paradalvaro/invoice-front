import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState({
    timezone: "Europe/Madrid",
    series: {
      invoices: [],
      albaranes: [],
      budgets: [],
      bills: [],
    },
  });
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const response = await api.get("/settings");
      setConfig(response.data);
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (newConfig) => {
    try {
      const response = await api.put("/settings", newConfig);
      setConfig(response.data);
      return { success: true };
    } catch (err) {
      console.error("Error updating settings:", err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <ConfigContext.Provider
      value={{ config, updateConfig, loading, refreshConfig: fetchConfig }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};
