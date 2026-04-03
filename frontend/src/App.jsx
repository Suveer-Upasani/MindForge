import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TemplateProvider } from './context/TemplateContext';
import { InspectionProvider } from './context/InspectionContext';

import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/app/Dashboard';
import AddProduct from './pages/app/AddProduct';
import Inspection from './pages/app/Inspection';
import Results from './pages/app/Results';
import History from './pages/app/History';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Simple Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <TemplateProvider>
        <InspectionProvider>
          <BrowserRouter>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />


              {/* Protected App Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />

                <Route path="add-product" element={<AddProduct />} />
                <Route path="inspection" element={<Inspection />} />
                <Route path="results" element={<Results />} />
                <Route path="billing" element={<div className="p-8">Billing View Placeholder</div>} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </InspectionProvider>
      </TemplateProvider>
    </AuthProvider>
  );
}


