import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

const InvoiceForm = () => {
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    clientName: "",
    totalAmount: "",
    date: "",
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
      setFormData({ ...invoice, date: formattedDate });
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
  }, [id]);

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
    return <p>Cargando factura...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>Error: {error}</p>;
  }*/

  return (
    <div className="container">
      <h2>{isEditMode ? "Edit Invoice" : "Create New Invoice"}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Invoice Number</label>
          <input
            type="text"
            name="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Client Name</label>
          <input
            type="text"
            name="clientName"
            value={formData.clientName}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Total Amount</label>
          <input
            type="number"
            name="totalAmount"
            value={formData.totalAmount}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">{isEditMode ? "Update" : "Create"}</button>
      </form>
    </div>
  );
};

export default InvoiceForm;
