// src/App.jsx
// Root application with BrowserRouter, providers, and all routes.

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { FarmProvider } from './context/FarmContext';

// Route guards
import ProtectedRoute from './router/ProtectedRoute';
import RoleRoute from './router/RoleRoute';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Shared protected pages
import ProfilePage from './pages/shared/ProfilePage';
import MarketplacePage from './pages/shared/MarketplacePage';

// Farmer pages
import DashboardPage from './pages/farmer/DashboardPage';
import FarmsPage from './pages/farmer/FarmsPage';
import CropsPage from './pages/farmer/CropsPage';
import SoilPhPage from './pages/farmer/SoilPhPage';
import WeatherPage from './pages/farmer/WeatherPage';
import AlertsPage from './pages/farmer/AlertsPage';
import ShopPage from './pages/farmer/ShopPage';
import PestTipsPage from './pages/farmer/PestTipsPage';
import ReportsPage from './pages/farmer/ReportsPage';

// Buyer pages
import InquiriesPage from './pages/buyer/InquiriesPage';

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminListingsPage from './pages/admin/AdminListingsPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <FarmProvider>
            <Routes>
            {/* ── Public routes ─────────────────────────────────────────── */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* ── Farmer routes (/app) ──────────────────────────────────── */}
            <Route
              path="/app/dashboard"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={['farmer']}>
                    <DashboardPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/farms"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={['farmer']}>
                    <FarmsPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/crops"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={['farmer']}>
                    <CropsPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/soil-ph"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={['farmer']}>
                    <SoilPhPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/weather"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={['farmer']}>
                    <WeatherPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/alerts"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={['farmer']}>
                    <AlertsPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/shop"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={['farmer']}>
                    <ShopPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/pest-tips"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={['farmer']}>
                    <PestTipsPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/reports"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={['farmer']}>
                    <ReportsPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />

            {/* Marketplace — shared between farmer and buyer */}
            <Route
              path="/app/marketplace"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={['farmer', 'buyer']}>
                    <MarketplacePage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />

            {/* Profile — farmer and buyer */}
            <Route
              path="/app/profile"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={['farmer', 'buyer']}>
                    <ProfilePage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />

            {/* ── Buyer routes ──────────────────────────────────────────── */}
            <Route
              path="/app/inquiries"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={['buyer']}>
                    <InquiriesPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />

            {/* ── Admin routes ──────────────────────────────────────────── */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={['admin']}>
                    <AdminDashboardPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={['admin']}>
                    <AdminUsersPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={['admin']}>
                    <AdminProductsPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/listings"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={['admin']}>
                    <AdminListingsPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={['admin']}>
                    <AdminBookingsPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />

            {/* Admin profile */}
            <Route
              path="/admin/profile"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={['admin']}>
                    <ProfilePage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />

            {/* Convenience redirect: /app → role home (handled by ProtectedRoute) */}
            <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />

            {/* ── 404 ───────────────────────────────────────────────────── */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </FarmProvider>
      </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
