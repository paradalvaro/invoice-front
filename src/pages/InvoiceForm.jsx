import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

const InvoiceForm = () => {
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    clientName: "",
    totalAmount: "",
    status: "Pending",
    date: "",
    dueDate: "",
  });
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
    } catch (err) {
      console.error("Error fetching invoice:", err);
      setError("Failed to fetch invoice");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isEditMode) {
      fetchInvoice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]); // Adding fetchInvoice might require wrapping it in useCallback, disabling for now to be safe with loop risks

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await api.put(`/invoices/${id}`, formData);
      } else {
        await api.post("/invoices", formData);
      }
      navigate("/invoices");
    } catch (err) {
      console.error("Error saving invoice:", err);
    }
  };

  /*if (isLoading) {
    return (
      <div
        className="container"
        style={{ textAlign: "center", padding: "2rem" }}
      >
        Cargando factura...
      </div>
    );
  }*/

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
          {isEditMode ? "Editar Factura" : "Nueva Factura"}
        </h2>
        <button
          onClick={() => navigate("/invoices")}
          className="btn btn-secondary"
        >
          Cancelar
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
                Nombre del Cliente
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                required
                style={{ fontSize: "1rem" }}
                placeholder="Ej. Empresa S.A."
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
                Número de Factura
              </label>
              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                required
                placeholder="INV-00000"
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
                Fecha
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
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
                Vencimiento
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
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
                Estado
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
                <option value="Draft">Borrador</option>
                <option value="Pending">Pendiente</option>
                <option value="Paid">Pagado</option>
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
                Monto Total
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
              {isEditMode ? "Actualizar Factura" : "Crear Factura"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
