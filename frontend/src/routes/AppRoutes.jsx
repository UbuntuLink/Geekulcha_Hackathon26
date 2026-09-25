import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import ForgotPassword from "../pages/auth/ForgotPassword.jsx";

import Welcome from "../pages/customer/Welcome.jsx";
import CustomerOnboarding from "../pages/customer/CustomerOnboarding.jsx";
import CustomerHome from "../pages/customer/CustomerHome.jsx";
import DescribeProblem from "../pages/customer/DescribeProblem.jsx";
import ServiceNotSupported from "../pages/customer/ServiceNotSupported.jsx";
import ReviewRequest from "../pages/customer/ReviewRequest.jsx";
import AIServiceIdentification from "../pages/customer/AIServiceIdentification.jsx";
import MatchingProviders from "../pages/customer/MatchingProviders.jsx";
import CompareProviders from "../pages/customer/CompareProviders.jsx";
import ProviderProfileView from "../pages/customer/ProviderProfileView.jsx";
import QuoteRequest from "../pages/customer/QuoteRequest.jsx";
import RequestQuotes from "../pages/customer/RequestQuotes.jsx";
import BookingConfirmation from "../pages/customer/BookingConfirmation.jsx";
import BookingTracking from "../pages/customer/BookingTracking.jsx";
import ReviewProvider from "../pages/customer/ReviewProvider.jsx";
import MyRequests from "../pages/customer/MyRequests.jsx";
import Profile from "../pages/customer/Profile.jsx";
import BecomeProvider from "../pages/customer/BecomeProvider.jsx";

import ProviderOnboarding from "../pages/provider/ProviderOnboarding.jsx";
import ProviderDashboard from "../pages/provider/ProviderDashboard.jsx";
import RequestsFeed from "../pages/provider/RequestsFeed.jsx";
import RequestDetail from "../pages/provider/RequestDetail.jsx";
import ProviderBookings from "../pages/provider/ProviderBookings.jsx";
import ProviderProfileEdit from "../pages/provider/ProviderProfileEdit.jsx";

import NotFound from "../pages/NotFound.jsx";

// Auth is now enforced by the backend on every route except /auth/** (PROJECT.md §8), so
// routes are gated here too — a logged-out visit anywhere below redirects to /login, and
// role-specific dashboards stay separated, while request/quote/booking pages are shared by any authenticated user.
export default function AppRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/onboarding" element={<CustomerOnboarding />} />

        {/* Customer journey — Figma screens 3-12, PROJECT.md §5 */}
        <Route path="/home" element={<ProtectedRoute role="customer"><CustomerHome /></ProtectedRoute>} />
        <Route path="/requests/new" element={<ProtectedRoute><DescribeProblem /></ProtectedRoute>} />
        <Route path="/requests/:id/classification" element={<ProtectedRoute><AIServiceIdentification /></ProtectedRoute>} />
        <Route path="/requests/:id/matches" element={<ProtectedRoute><MatchingProviders /></ProtectedRoute>} />
        <Route path="/requests/:id/compare" element={<ProtectedRoute><CompareProviders /></ProtectedRoute>} />
        <Route path="/providers/:providerId" element={<ProtectedRoute><ProviderProfileView /></ProtectedRoute>} />
        <Route path="/requests/:id/quote" element={<ProtectedRoute><QuoteRequest /></ProtectedRoute>} />
        <Route path="/requests/:id/quotes" element={<ProtectedRoute><RequestQuotes /></ProtectedRoute>} />
        <Route path="/bookings/:bookingId/confirmation" element={<ProtectedRoute><BookingConfirmation /></ProtectedRoute>} />
        <Route path="/bookings/:bookingId" element={<ProtectedRoute><BookingTracking /></ProtectedRoute>} />
        <Route path="/bookings/:bookingId/review" element={<ProtectedRoute><ReviewProvider /></ProtectedRoute>} />
        <Route path="/requests/mine" element={<ProtectedRoute><MyRequests /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute role="customer"><Profile /></ProtectedRoute>} />
        <Route path="/become-provider" element={<ProtectedRoute role="customer"><BecomeProvider /></ProtectedRoute>} />
        <Route path="/requests/review" element={<ProtectedRoute><ReviewRequest /></ProtectedRoute>} />
        <Route path="/requests/not-supported" element={<ProtectedRoute><ServiceNotSupported /></ProtectedRoute>} />

        {/* Provider side — freely designed, no Figma (PROJECT.md §9a) */}
        <Route path="/provider/onboarding" element={<ProtectedRoute role="provider"><ProviderOnboarding /></ProtectedRoute>} />
        <Route path="/provider/dashboard" element={<ProtectedRoute role="provider"><ProviderDashboard /></ProtectedRoute>} />
        <Route path="/provider/requests" element={<ProtectedRoute role="provider"><RequestsFeed /></ProtectedRoute>} />
        <Route path="/provider/requests/:id" element={<ProtectedRoute role="provider"><RequestDetail /></ProtectedRoute>} />
        <Route path="/provider/bookings" element={<ProtectedRoute role="provider"><ProviderBookings /></ProtectedRoute>} />
        <Route path="/provider/profile" element={<ProtectedRoute role="provider"><ProviderProfileEdit /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
