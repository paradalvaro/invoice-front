import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import InvoiceList from "./pages/InvoiceList";
import InvoiceForm from "./pages/InvoiceForm";
import UserList from "./pages/UserList";
import UserForm from "./pages/UserForm";
import ClientList from "./pages/ClientList";
import ClientForm from "./pages/ClientForm";
import BudgetList from "./pages/BudgetList";
import BudgetForm from "./pages/BudgetForm";
import AlbaranList from "./pages/AlbaranList";
import AlbaranForm from "./pages/AlbaranForm";
import Modelo347 from "./pages/Modelo347";
import Configuration from "./pages/Configuration";
import ProtectedRoute from "./components/ProtectedRoute";

import Layout from "./components/Layout";

import { NotificationProvider } from "./context/NotificationContext";
import { ConfigProvider } from "./context/ConfigContext";
import Toast from "./components/Toast";

function App() {
  return (
    <ConfigProvider>
      <NotificationProvider>
        <Toast />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/invoices" element={<InvoiceList />} />
              <Route path="/invoices/new" element={<InvoiceForm />} />
              <Route path="/invoices/:id/edit" element={<InvoiceForm />} />
              <Route path="/invoices/:id/rectify" element={<InvoiceForm />} />

              <Route path="/users" element={<UserList />} />
              <Route path="/users/new" element={<UserForm />} />
              <Route path="/users/:id/edit" element={<UserForm />} />

              <Route path="/clients" element={<ClientList />} />
              <Route path="/clients/new" element={<ClientForm />} />
              <Route path="/clients/edit/:id" element={<ClientForm />} />

              <Route path="/budgets" element={<BudgetList />} />
              <Route path="/budgets/new" element={<BudgetForm />} />
              <Route path="/budgets/:id/edit" element={<BudgetForm />} />

              <Route path="/albaranes" element={<AlbaranList />} />
              <Route path="/albaranes/new" element={<AlbaranForm />} />
              <Route path="/albaranes/:id/edit" element={<AlbaranForm />} />
              <Route path="/configuration" element={<Configuration />} />
              <Route path="/modelo347" element={<Modelo347 />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/invoices" />} />
        </Routes>
      </NotificationProvider>
    </ConfigProvider>
  );
}

export default App;
