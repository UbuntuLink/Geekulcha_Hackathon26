import { apiClient } from "./client";
import { mlClient } from "./mlClient";

// --- ML service (Python/FastAPI) ---
export const classifyMessage = (message) =>
  mlClient.post("/classify", { message }).then((res) => res.data);

export const estimatePrice = (category, message) =>
  mlClient.post("/price", { category, message }).then((res) => res.data);

// --- Backend: catalog ---
export const listServices = () => apiClient.get("/api/services").then((res) => res.data);

// --- Backend: service requests ---
export const createServiceRequest = (payload) =>
  apiClient.post("/api/service-requests", payload).then((res) => res.data);

export const getServiceRequest = (id) =>
  apiClient.get(`/api/service-requests/${id}`).then((res) => res.data);

export const getMyServiceRequests = () =>
  apiClient.get("/api/service-requests/mine").then((res) => res.data);

// --- Backend: matching / provider profile ---
export const getMatchingProviders = (serviceId) =>
  apiClient.get(`/api/services/${serviceId}/providers`).then((res) => res.data);

export const getProviderProfile = (providerProfileId) =>
  apiClient.get(`/api/provider-profiles/${providerProfileId}`).then((res) => res.data);

// --- Backend: quotes / bookings / reviews / mock payment ---
export const createQuote = (payload) =>
  apiClient.post("/api/quotes", payload).then((res) => res.data);

export const acceptQuote = (quoteId, payload) =>
  apiClient.post(`/api/bookings/accept-quote/${quoteId}`, payload).then((res) => res.data);

export const getBooking = (bookingId) =>
  apiClient.get(`/api/bookings/${bookingId}`).then((res) => res.data);

export const updateBookingStatus = (bookingId, status) =>
  apiClient.patch(`/api/bookings/${bookingId}/status`, null, { params: { status } }).then((res) => res.data);

export const mockCharge = (bookingId, amount) =>
  apiClient.post(`/api/bookings/${bookingId}/payment/mock-charge`, null, { params: { amount } }).then((res) => res.data);

export const submitReview = (bookingId, payload) =>
  apiClient.post(`/api/bookings/${bookingId}/review`, payload).then((res) => res.data);
