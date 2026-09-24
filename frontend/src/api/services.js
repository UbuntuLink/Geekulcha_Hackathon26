import { apiClient } from "./client";
import { mlClient } from "./mlClient";

// --- ML service (Python/FastAPI) ---
// `categories` is the live catalog from GET /api/services. Passing it makes the model answer in
// the exact names the database uses, instead of its own vocabulary — see matching.js for why.
export const classifyMessage = (message, categories = null) =>
  mlClient.post("/classify", { message, categories }).then((res) => res.data);

export const estimatePrice = (category, message) =>
  mlClient.post("/price", { category, message }).then((res) => res.data);

// --- Backend: catalog ---
export const listServices = () => apiClient.get("/api/services").then((res) => res.data);

// --- Backend: service requests (customer) ---
export const createServiceRequest = (payload) =>
  apiClient.post("/api/service-requests", payload).then((res) => res.data);

export const getServiceRequest = (id) =>
  apiClient.get(`/api/service-requests/${id}`).then((res) => res.data);

export const refineDescription = (job_description, additional_details) => mlClient
    .post("/classify/refine-description", {
      job_description,
      additional_details,
    })
    .then((res) => res.data);

export const createUnsupportedServiceRequest = (payload) =>
  apiClient
    .post("/api/unsupported-service-requests", payload)
    .then((res) => res.data);

export const getMyServiceRequests = () =>
  apiClient.get("/api/service-requests/mine").then((res) => res.data);

export const setPreferredProvider = (requestId, providerProfileId) =>
  apiClient
    .patch(`/api/service-requests/${requestId}/preferred-provider`, null, { params: { providerProfileId } })
    .then((res) => res.data);

export const getQuotesForRequest = (requestId) =>
  apiClient.get(`/api/service-requests/${requestId}/quotes`).then((res) => res.data);

// --- Backend: service requests (provider) ---
export const getOpenRequests = () => apiClient.get("/api/service-requests/open").then((res) => res.data);

// --- Backend: matching / public provider profile (browsing, no auth needed to view) ---
export const getMatchingProviders = (serviceId) =>
  apiClient.get(`/api/services/${serviceId}/providers`).then((res) => res.data);

export const getProviderProfile = (providerProfileId) =>
  apiClient.get(`/api/provider-profiles/${providerProfileId}`).then((res) => res.data);

// --- Backend: self-service provider profile ---
export const getMyProviderProfile = () => apiClient.get("/api/provider-profiles/me").then((res) => res.data);

export const updateMyProviderProfile = (payload) =>
  apiClient.patch("/api/provider-profiles/me", payload).then((res) => res.data);

export const addMyProviderService = (payload) =>
  apiClient.put("/api/provider-profiles/me/services", payload).then((res) => res.data);

export const removeMyProviderService = (serviceId) =>
  apiClient.delete(`/api/provider-profiles/me/services/${serviceId}`).then((res) => res.data);

// --- Backend: quotes ---
// No providerProfileId here on purpose — the backend derives the provider from the signed-in
// caller (see QuoteController). payload: { serviceRequestId, amount, message }
export const createQuote = (payload) =>
  apiClient.post("/api/quotes", payload).then((res) => res.data);

export const rejectQuote = (quoteId) =>
  apiClient.patch(`/api/quotes/${quoteId}/reject`).then((res) => res.data);

// --- Backend: bookings (customer) ---
export const acceptQuote = (quoteId, payload) =>
  apiClient.post(`/api/bookings/accept-quote/${quoteId}`, payload).then((res) => res.data);

export const getBooking = (bookingId) =>
  apiClient.get(`/api/bookings/${bookingId}`).then((res) => res.data);

export const submitReview = (bookingId, payload) =>
  apiClient.post(`/api/bookings/${bookingId}/review`, payload).then((res) => res.data);

// --- Backend: bookings (provider) ---
export const getMyBookings = () => apiClient.get("/api/bookings/mine").then((res) => res.data);

export const updateBookingStatus = (bookingId, status) =>
  apiClient.patch(`/api/bookings/${bookingId}/status`, null, { params: { status } }).then((res) => res.data);

export const mockCharge = (bookingId, amount) =>
  apiClient.post(`/api/bookings/${bookingId}/payment/mock-charge`, null, { params: { amount } }).then((res) => res.data);
