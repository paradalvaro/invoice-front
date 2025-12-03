import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";

const baseURL = import.meta.env.VITE_API_URL;
const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { logout } = useAuth();

  const fetchInvoices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/invoices");
      setInvoices(response.data);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError("No se pudieron cargar las facturas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      try {
        await api.delete(`/invoices/${id}`);
        fetchInvoices();
      } catch (err) {
        console.error("Error deleting invoice:", err);
      }
    }
  };

  /*if (isLoading) {
    return <p>Cargando facturas...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>Error: {error}</p>;
  }*/

  return (
    <div className="container">
      <header>
        <h1>My Invoices</h1>
        <button onClick={logout}>Logout</button>
      </header>
      <Link to="/invoices/new" className="btn btn-primary">
        Create New Invoice
      </Link>
      <table>
        <thead>
          <tr>
            <th>Number</th>
            <th>Client</th>
            <th>Total</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 ? (
            <p>No hay facturas para mostrar.</p>
          ) : (
            invoices.map((invoice) => (
              <tr key={invoice._id}>
                <td>{invoice.invoiceNumber}</td>
                <td>{invoice.clientName}</td>
                <td>${invoice.totalAmount}</td>
                <td>{new Date(invoice.date).toLocaleDateString()}</td>
                <td>
                  <Link
                    to={`/invoices/${invoice._id}/edit`}
                    className="btn btn-small"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => {
                      const token = localStorage.getItem("token");
                      window.open(
                        `${baseURL}/invoices/${invoice._id}/pdf?token=${token}`,
                        "_blank"
                      );
                    }}
                    className="btn btn-small"
                    style={{ backgroundColor: "#28a745" }}
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => handleDelete(invoice._id)}
                    className="btn btn-small btn-danger"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceList;
