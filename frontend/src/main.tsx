import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'

import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { NewEventPage } from './pages/NewEventPage'
import { EditorPage } from './pages/EditorPage'
import { useAuthStore } from './store/useAuthStore'
import api from './services/api'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore(state => state.token);


  useEffect(() => {
    if (token) {
      api.get('/auth/me').catch(() => {
        useAuthStore.getState().logout();
      });
    }
  }, [token]);

  return token ? <>{children}</> : <Navigate to="/login" />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ className: 'bg-sidebar text-textPrimary border border-border' }} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/new" element={<PrivateRoute><NewEventPage /></PrivateRoute>} />
        <Route path="/editor/:eventId" element={<PrivateRoute><EditorPage /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
