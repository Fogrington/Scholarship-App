import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAdminData } from "../context/AdminDataContext";
import { LogoIcon, GridIcon, ClipboardIcon, AlertIcon, BuildingIcon, LogoutIcon } from "../components/Icons";

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "A"
  );
}

export default function AdminLayout() {
  const { adminName, logout } = useAuth();
  const { applications, complaints } = useAdminData();
  const navigate = useNavigate();

  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const openComplaintsCount = complaints.filter((c) => c.status === "open").length;

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <LogoIcon width={16} height={16} color="#1A1A1A" />
          </div>
          <div className="brand-text">
            Confirmea
            <span>ADMIN PANEL</span>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/overview" className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
            <GridIcon />
            Overview
          </NavLink>
          <NavLink to="/applications" className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
            <ClipboardIcon />
            Applications
            <span className="nav-count">{pendingCount}</span>
          </NavLink>
          <NavLink to="/complaints" className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
            <AlertIcon />
            Complaints
            <span className="nav-count">{openComplaintsCount}</span>
          </NavLink>
          <NavLink to="/businesses" className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
            <BuildingIcon />
            Businesses
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-chip">
            <div className="admin-avatar">{initials(adminName ?? "Admin")}</div>
            <div>
              <div className="admin-name">{adminName ?? "Admin"}</div>
              <div className="admin-role">Reviewer</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogoutIcon />
            Log out
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
