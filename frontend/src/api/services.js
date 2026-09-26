import { apiClient } from "./client";
import { mlClient } from "./mlClient";

// --- ML service (Python/FastAPI) ---
// `categories` is the live catalog from GET /api/services. Passing it makes the model answer in
// the exact names the database uses, instead of its own vocabulary — see matching.js for why.
// `photoDataUrl` is an optional data-URL image the model inspects alongside the text.
//
// Both were added as the second argument on separate branches; categories kept that position
// because it is the one every caller passes.
export const classifyMessage = (message, categories = null, photoDataUrl = null) =>
  mlClient
    .post("/classify", {
      message,
      ...(categories ? { categories } : {}),
      ...(photoDataUrl ? { photoDataUrl } : {}),
    })
    .then((res) => res.data);

export const estimatePrice = (category, message) =>
  mlClient.post("/price", { category, message }).then((res) => res.data);

// --- Backend: catalog ---
export const listServices = () => apiClient.get("/api/services").then((res) => res.data);

// --- Backend: service requests (customer) ---
export const createServiceRequest = (payload) =>
  apiClient.post("/api/service-requests", payload).then((res) => res.data);

export const getServiceRequest = (id) =>
  apiClient.get(`/api/service-requests/${id}`).then((res) => res.data);

// Base64 WAV from lib/wavRecorder.js; resolves to the transcript, in the language spoken.
export const transcribeAudio = (audioBase64) =>
  mlClient.post("/transcribe", { audioBase64 }, { timeout: 60000 }).then((res) => res.data.text);

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

export const deleteServiceRequest = (id) =>
  apiClient.delete(`/api/service-requests/${id}`).then((res) => res.data);

export const setPreferredProvider = (requestId, providerProfileId) =>
  apiClient
    .patch(`/api/service-requests/${requestId}/preferred-provider`, null, { params: { providerProfileId } })
    .then((res) => res.data);

export const getQuotesForRequest = (requestId) =>
  apiClient.get(`/api/service-requests/${requestId}/quotes`).then((res) => res.data);

// --- Backend: service requests (provider) ---
export const getOpenRequests = () => apiClient.get("/api/service-requests/open").then((res) => res.data);

// --- Backend: matching / public provider profile (browsing, no auth needed to view) ---
// Coordinates are optional: with them the backend drops providers whose service radius doesn't
// reach the job and returns the rest nearest-first, with a distanceKm on each row.
export const getMatchingProviders = (serviceId, latitude = null, longitude = null) => {
  const params = latitude != null && longitude != null ? { latitude, longitude } : undefined;
  return apiClient.get(`/api/services/${serviceId}/providers`, { params }).then((res) => res.data);
};

// The matches page's first load: providers whose service radius reaches the customer, plus how
// many more are further away (from the X-Further-Away-Count header), without fetching those yet.
export const getNearbyProviders = (serviceId, latitude = null, longitude = null) => {
  const params = latitude != null && longitude != null ? { latitude, longitude } : undefined;
  return apiClient.get(`/api/services/${serviceId}/providers`, { params }).then((res) => ({
    providers: res.data,
    furtherCount: Number(res.headers["x-further-away-count"] ?? 0) || 0,
  }));
};

// Loaded only when the customer taps "View more": providers outside their own service radius.
export const getFurtherProviders = (serviceId, latitude = null, longitude = null) => {
  const params = { scope: "further", ...(latitude != null && longitude != null ? { latitude, longitude } : {}) };
  return apiClient.get(`/api/services/${serviceId}/providers`, { params }).then((res) => res.data);
};

export const getProviderProfile = (providerProfileId) =>
  apiClient.get(`/api/provider-profiles/${providerProfileId}`).then((res) => res.data);

// Uses Spring's default urgency (0.5) and the same location as the normal matches.
export const getQuantumMatch = (jobId, serviceId, latitude = null, longitude = null, signal) =>
  apiClient.get("/api/quantum-match", {
    params: {
      jobId,
      serviceId,
      ...(latitude != null && longitude != null ? { latitude, longitude } : {}),
    },
    signal,
    timeout: 30000,
  }).then((res) => res.data);

// --- Backend: self-service provider profile ---
export const getMyProviderProfile = () => apiClient.get("/api/provider-profiles/me").then((res) => res.data);

// Creates a provider profile for an existing customer account. The backend should link
// the new profile to the authenticated user and then /api/users/me should return isProvider=true.
export const createMyProviderProfile = (payload) =>
  apiClient.post("/api/provider-profiles/me", payload).then((res) => res.data);

export const updateMyProviderProfile = (payload) =>
  apiClient.patch("/api/provider-profiles/me", payload).then((res) => res.data);

export const addMyProviderService = (payload) =>
  apiClient.put("/api/provider-profiles/me/services", payload).then((res) => res.data);

export const removeMyProviderService = (serviceId) =>
  apiClient.delete(`/api/provider-profiles/me/services/${serviceId}`).then((res) => res.data);

// --- Backend: quotes ---
// No providerProfileId here on purpose — the backend derives the provider from the signed-in
// caller (see QuoteController). payload: { serviceRequestId, amount, message }
// Every quote on the signed-in customer's requests, newest first (QuoteSummaryResponse).
export const getMyQuotes = () => apiClient.get("/api/quotes/mine").then((res) => res.data);

// Provider side: quotes they've sent, and requests customers sent to them specifically.
export const getSentQuotes = () => apiClient.get("/api/quotes/sent").then((res) => res.data);
export const getQuoteRequestsForMe = () => apiClient.get("/api/quotes/requested-from-me").then((res) => res.data);

export const createQuote = (payload) =>
  apiClient.post("/api/quotes", payload).then((res) => res.data);

export const rejectQuote = (quoteId) =>
  apiClient.patch(`/api/quotes/${quoteId}/reject`).then((res) => res.data);

// --- Backend: bookings (customer) ---
export const acceptQuote = (quoteId, payload) =>
  apiClient.post(`/api/bookings/accept-quote/${quoteId}`, payload).then((res) => res.data);

export const getBooking = (bookingId) =>
  apiClient.get(`/api/bookings/${bookingId}`).then((res) => res.data);

// A review photo as an <img src>. The endpoint is public, so no token is needed.
export const reviewPhotoUrl = (photoId) => `${apiClient.defaults.baseURL}/api/review-photos/${photoId}`;

// payload: { rating, comment, photos: [data URL, ...] } — photos resized by lib/imageResize.js.
export const submitReview = (bookingId, payload) =>
  apiClient.post(`/api/bookings/${bookingId}/review`, payload).then((res) => res.data);

// --- Backend: bookings (provider) ---
export const getMyBookings = () => apiClient.get("/api/bookings/mine").then((res) => res.data);

// note is optional: shown to the other side on the tracker ("Running 10 minutes late").
export const updateBookingStatus = (bookingId, status, note = "") =>
  apiClient
    .patch(`/api/bookings/${bookingId}/status`, null, { params: { status, ...(note.trim() ? { note: note.trim() } : {}) } })
    .then((res) => res.data);

export const getBookingTimeline = (bookingId) =>
  apiClient.get(`/api/bookings/${bookingId}/timeline`).then((res) => res.data);

// The signed-in customer's bookings, to link booked requests to their tracker.
export const getCustomerBookings = () => apiClient.get("/api/bookings/as-customer").then((res) => res.data);

export const mockCharge = (bookingId, amount) =>
  apiClient.post(`/api/bookings/${bookingId}/payment/mock-charge`, null, { params: { amount } }).then((res) => res.data);

// --- Messaging ---
export const listConversations = () => apiClient.get("/api/conversations").then((res) => res.data);
export const getUnreadMessageCount = () =>
  apiClient.get("/api/conversations/unread-count").then((res) => res.data.count ?? 0);
// Opens (or creates) the one thread between the caller and this provider / this customer.
export const openChatWithProvider = (providerProfileId) =>
  apiClient.post(`/api/conversations/with-provider/${providerProfileId}`).then((res) => res.data);
export const openChatWithCustomer = (customerUserId) =>
  apiClient.post(`/api/conversations/with-customer/${customerUserId}`).then((res) => res.data);
// after: only messages newer than this id, for polling an open chat.
export const getMessages = (conversationId, after = 0) =>
  apiClient.get(`/api/conversations/${conversationId}/messages`, { params: { after } }).then((res) => res.data);
export const sendMessage = (conversationId, body) =>
  apiClient.post(`/api/conversations/${conversationId}/messages`, { body }).then((res) => res.data);
