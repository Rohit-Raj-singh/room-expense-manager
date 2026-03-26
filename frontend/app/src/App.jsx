import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import FeaturesPage from "./pages/FeaturesPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardIndexPage from "./pages/DashboardIndexPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import { useAuth } from "./state/AuthContext.jsx";
import TopNav from "./components/layout/TopNav.jsx";

function PrivateRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { token } = useAuth();

  return (
    <div className="min-h-screen bg-app">
      <TopNav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/auth" element={<Navigate to="/login" replace />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardIndexPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/:groupId"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

