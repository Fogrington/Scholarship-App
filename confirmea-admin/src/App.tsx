import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AdminDataProvider } from "./context/AdminDataContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import AdminLayout from "./pages/AdminLayout";
import OverviewPage from "./pages/OverviewPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import ComplaintsPage from "./pages/ComplaintsPage";
import BusinessesPage from "./pages/BusinessesPage";

export default function App() {
  return (
    <AuthProvider>
      <AdminDataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/overview" element={<OverviewPage />} />
              <Route path="/applications" element={<ApplicationsPage />} />
              <Route path="/complaints" element={<ComplaintsPage />} />
              <Route path="/businesses" element={<BusinessesPage />} />
            </Route>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </BrowserRouter>
      </AdminDataProvider>
    </AuthProvider>
  );
}
