import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const Layout = () => {
  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Header />
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar />
        <main
          style={{
            flex: 1,
            backgroundColor: "var(--color-background)",
            padding: "2rem",
            overflowY: "auto",
            height: "calc(100vh - 60px)",
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
