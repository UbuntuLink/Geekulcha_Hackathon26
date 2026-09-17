import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext.jsx";

import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";

import Welcome from "../pages/customer/Welcome.jsx";
import CustomerOnboarding from "../pages/customer/CustomerOnboarding.jsx";
import CustomerHome from "../pages/customer/CustomerHome.jsx";
import DescribeProblem from "../pages/customer/DescribeProblem.jsx";
import AIServiceIdentification from "../pages/customer/AIServiceIdentification.jsx";
import MatchingProviders from "../pages/customer/MatchingProviders.jsx";
import CompareProviders from "../pages/customer/CompareProviders.jsx";
import ProviderProfileView from "../pages/customer/ProviderProfileView.jsx";
import QuoteRequest from "../pages/customer/QuoteRequest.jsx";
import BookingConfirmation from "../pages/customer/BookingConfirmation.jsx";
import BookingTracking from "../pages/customer/BookingTracking.jsx";
import ReviewProvider from "../pages/customer/ReviewProvider.jsx";
import MyRequests from "../pages/customer/MyRequests.jsx";
import Profile from "../pages/customer/Profile.jsx";

import ProviderOnboarding from "../pages/provider/ProviderOnboarding.jsx";
import ProviderDashboard from "../pages/provider/ProviderDashboard.jsx";
import RequestsFeed from "../pages/provider/RequestsFeed.jsx";
import RequestDetail from "../pages/provider/RequestDetail.jsx";
import ProviderBookings from "../pages/provider/ProviderBookings.jsx";
import ProviderProfileEdit from "../pages/provider/ProviderProfileEdit.jsx";

import NotFound from "../pages/NotFound.jsx";

// NOTE: auth gating is OFF for now (every route below was wrapped in <ProtectedRoute> —
// removed so all screens are clickable without logging in or a running backend, and because
// the backend doesn't validate the JWT on business endpoints yet either — see PROJECT.md §8).
// AuthProvider is still here so useAuth()/AuthContext keep working once auth is enforced.
// See PROJECT.md §8 — re-add <ProtectedRoute> around the customer/provider routes when ready.
export default function AppRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<CustomerOnboarding />} />

        {/* Customer journey — Figma screens 3-12, PROJECT.md §5 */}
        <Route path="/home" element={<CustomerHome />} />
        <Route path="/requests/new" element={<DescribeProblem />} />
        <Route path="/requests/:id/classification" element={<AIServiceIdentification />} />
        <Route path="/requests/:id/matches" element={<MatchingProviders />} />
        <Route path="/requests/:id/compare" element={<CompareProviders />} />
        <Route path="/providers/:providerId" element={<ProviderProfileView />} />
        <Route path="/requests/:id/quote" element={<QuoteRequest />} />
        <Route path="/bookings/:bookingId/confirmation" element={<BookingConfirmation />} />
        <Route path="/bookings/:bookingId" element={<BookingTracking />} />
        <Route path="/bookings/:bookingId/review" element={<ReviewProvider />} />
        <Route path="/requests/mine" element={<MyRequests />} />
        <Route path="/profile" element={<Profile />} />

        {/* Provider side — no Figma yet, see PROJECT.md §9a */}
        <Route path="/provider/onboarding" element={<ProviderOnboarding />} />
        <Route path="/provider/dashboard" element={<ProviderDashboard />} />
        <Route path="/provider/requests" element={<RequestsFeed />} />
        <Route path="/provider/requests/:id" element={<RequestDetail />} />
        <Route path="/provider/bookings" element={<ProviderBookings />} />
        <Route path="/provider/profile" element={<ProviderProfileEdit />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
