import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import SuperAdminRoute from './components/SuperAdminRoute'
import { AuthProvider } from './context/AuthContext'
import { LocationProvider } from './context/LocationContext'
import { MessageNotificationsProvider } from './context/MessageNotificationsContext'
import AuthCallbackPage from './pages/AuthCallbackPage'
import AuthPage from './pages/AuthPage'
import LandingPage from './pages/LandingPage'
import ProfilePage from './pages/ProfilePage'
import RoleSelectPage from './pages/RoleSelectPage'
import SuperLoginPage from './pages/SuperLoginPage'
import ChatThreadPage from './pages/ChatThreadPage'
import MessagesPage from './pages/MessagesPage'
import BuyerHomePage from './pages/buyer/BuyerHomePage'
import BuyerProductDetailPage from './pages/buyer/BuyerProductDetailPage'
import CategoriesPage from './pages/buyer/CategoriesPage'
import SavedListingsPage from './pages/buyer/SavedListingsPage'
import AddProductPage from './pages/seller/AddProductPage'
import SellerDashboardPage from './pages/seller/SellerDashboardPage'
import SellerProductDetailPage from './pages/seller/SellerProductDetailPage'
import SuperAdminLayout from './pages/superadmin/SuperAdminLayout'
import OverviewPage from './pages/superadmin/OverviewPage'
import UsersPage from './pages/superadmin/UsersPage'
import ProductsPage from './pages/superadmin/ProductsPage'
import AdminsPage from './pages/superadmin/AdminsPage'

function BuyerProfilePage() {
  return <ProfilePage role="buyer" />
}

function SellerProfilePage() {
  return <ProfilePage role="seller" />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
        <MessageNotificationsProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/superlogin" element={<SuperLoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          <Route
            path="/superadmin"
            element={
              <SuperAdminRoute>
                <SuperAdminLayout />
              </SuperAdminRoute>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="admins" element={<AdminsPage />} />
          </Route>

          <Route
            path="/onboarding/role"
            element={
              <ProtectedRoute>
                <RoleRoute role="none">
                  <RoleSelectPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/buyer"
            element={
              <ProtectedRoute>
                <RoleRoute role="buyer">
                  <BuyerHomePage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/categories"
            element={
              <ProtectedRoute>
                <RoleRoute role="buyer">
                  <CategoriesPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/products/:id"
            element={
              <ProtectedRoute>
                <RoleRoute role="buyer">
                  <BuyerProductDetailPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/saved"
            element={
              <ProtectedRoute>
                <RoleRoute role="buyer">
                  <SavedListingsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/messages"
            element={
              <ProtectedRoute>
                <RoleRoute role="buyer">
                  <MessagesPage role="buyer" />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/messages/:id"
            element={
              <ProtectedRoute>
                <RoleRoute role="buyer">
                  <ChatThreadPage role="buyer" />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/profile"
            element={
              <ProtectedRoute>
                <RoleRoute role="buyer">
                  <BuyerProfilePage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/seller"
            element={
              <ProtectedRoute>
                <RoleRoute role="seller">
                  <SellerDashboardPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/add-product"
            element={
              <ProtectedRoute>
                <RoleRoute role="seller">
                  <AddProductPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/products/:id"
            element={
              <ProtectedRoute>
                <RoleRoute role="seller">
                  <SellerProductDetailPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/messages"
            element={
              <ProtectedRoute>
                <RoleRoute role="seller">
                  <MessagesPage role="seller" />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/messages/:id"
            element={
              <ProtectedRoute>
                <RoleRoute role="seller">
                  <ChatThreadPage role="seller" />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/profile"
            element={
              <ProtectedRoute>
                <RoleRoute role="seller">
                  <SellerProfilePage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </MessageNotificationsProvider>
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
