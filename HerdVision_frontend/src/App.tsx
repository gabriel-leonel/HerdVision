import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, PublicOnly, RequireAuth } from './auth/AuthContext';
import { ToastProvider } from './components/Feedback';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { AlertsPage } from './pages/alerts/AlertsPage';
import { AnimalDetailPage } from './pages/animals/AnimalDetailPage';
import { AnimalFormPage } from './pages/animals/AnimalFormPage';
import { AnimalsListPage } from './pages/animals/AnimalsListPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { LotFormPage } from './pages/lots/LotFormPage';
import { LotsListPage } from './pages/lots/LotsListPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtocolsPage } from './pages/protocols/ProtocolsPage';
import { RegisterPage } from './pages/RegisterPage';
import { UsersPage } from './pages/UsersPage';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnly>
                  <AuthLayout tagline="Dados do rebanho em decisões inteligentes." support="Acompanhe cada animal, receba alertas no momento certo e aja cedo.">
                    <LoginPage />
                  </AuthLayout>
                </PublicOnly>
              }
            />
            <Route
              path="/cadastro"
              element={
                <PublicOnly>
                  <AuthLayout tagline="Rebanho sob controle." support="Crie sua conta e organize lotes, animais, protocolos e alertas em um só lugar.">
                    <RegisterPage />
                  </AuthLayout>
                </PublicOnly>
              }
            />

            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="animais" element={<AnimalsListPage />} />
              <Route path="animais/novo" element={<AnimalFormPage />} />
              <Route path="animais/:id" element={<AnimalDetailPage />} />
              <Route path="animais/:id/editar" element={<AnimalFormPage key="edit" />} />
              <Route path="lotes" element={<LotsListPage />} />
              <Route path="lotes/novo" element={<LotFormPage />} />
              <Route path="lotes/:id" element={<LotFormPage key="edit" />} />
              <Route path="protocolos" element={<ProtocolsPage />} />
              <Route path="alertas" element={<AlertsPage />} />
              <Route path="usuarios" element={<UsersPage />} />
              <Route path="painel" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
