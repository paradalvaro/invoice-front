import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { useLanguage } from "../context/LanguageContext";

const UserForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    lastName: "",
    type: "User",
    password: "",
  });
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isEditMode) {
      api
        .get("/auth/users")
        .then((response) => {
          const user = response.data.find((u) => u._id === id);
          if (user) {
            setFormData({
              username: user.username,
              name: user.name,
              lastName: user.lastName,
              type: user.type || "User",
              password: "", // Password not needed/shown for edit usually
            });
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching user:", err);
          setError(t("error"));
          setIsLoading(false);
        });
    }
  }, [id, isEditMode, t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("lastName", formData.lastName);
      data.append("username", formData.username);
      data.append("type", formData.type);
      if (formData.password) {
        data.append("password", formData.password);
      }
      if (file) {
        data.append("photo", file);
      }

      if (isEditMode) {
        await api.put(`/auth/users/${id}`, data);
      } else {
        await api.post("/auth/register", data);
      }
      navigate("/users");
    } catch (err) {
      console.error("Error saving user:", err);
      setError(err.response?.data?.message || t("error"));
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "1.875rem",
            fontWeight: "bold",
            color: "var(--color-text-main)",
            marginBottom: "1.5rem",
          }}
        >
          {isEditMode ? t("editUser") : t("newUser")}
        </h1>

        <div
          style={{
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "0.5rem",
            boxShadow: "var(--shadow-sm)",
            border: "1px solid var(--color-border)",
          }}
        >
          {error && (
            <div
              style={{
                backgroundColor: "#fee2e2",
                color: "#ef4444",
                padding: "0.75rem",
                borderRadius: "0.375rem",
                marginBottom: "1rem",
              }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: "grid", gap: "1rem" }}
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
                {t("name")}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
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
                {t("lastName")}
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
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
                {t("username")}
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={isEditMode}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #cbd5e1",
                  backgroundColor: isEditMode ? "#f3f4f6" : "white",
                }}
              />
            </div>

            {!isEditMode && (
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "500",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {t("password")}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
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
                {t("role")}
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
                <option value="User">User</option>
                <option value="Admin">Admin</option>
                <option value="SuperAdmin">SuperAdmin</option>
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
                {t("photo")}
              </label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                accept="image/*"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #cbd5e1",
                }}
              />
            </div>

            <div
              className="flex justify-between items-center"
              style={{ marginTop: "1rem" }}
            >
              <button
                type="button"
                onClick={() => navigate("/users")}
                style={{
                  backgroundColor: "transparent",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border)",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                {t("cancel")}
              </button>
              <button
                disabled={isLoading}
                type="submit"
                className="btn btn-primary"
              >
                {isLoading ? t("saving") : t("saveChanges")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserForm;
