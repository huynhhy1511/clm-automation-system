import { Routes, Route } from "react-router-dom";
import { AdminLayout } from "./layouts/AdminLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { RoomsPage } from "./pages/RoomsPage";
import { BillingPage } from "./pages/BillingPage";
import { IncidentReportPage } from "./pages/IncidentReportPage";
import { ContractsPage } from "./pages/ContractsPage";
import { ClientLayout } from "./layouts/ClientLayout";
import { ClientDashboardPage } from "./pages/ClientDashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { AdminRequestsPage } from "./pages/AdminRequestsPage";
import { ClientProfilePage } from "./pages/ClientProfilePage";
import { AdminIncidentsPage } from "./pages/AdminIncidentsPage";
import { ClientBillingPage } from "./pages/ClientBillingPage";

export default function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Admin Protected Layout */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="requests" element={<AdminRequestsPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="contracts" element={<ContractsPage />} />
        <Route path="incidents" element={<AdminIncidentsPage />} />
      </Route>
      
      {/* Client Protected Layout (tenant) */}
      <Route path="/client" element={<ClientLayout />}>
           <Route index element={<ClientDashboardPage />} />
           <Route path="incidents" element={<IncidentReportPage />} />
           <Route path="billing" element={<ClientBillingPage />} />
           <Route path="profile" element={<ClientProfilePage />} />
      </Route>
    </Routes>
  );
}
