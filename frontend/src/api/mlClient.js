import axios from "axios";

// FastAPI ML service (Render) — job classification + price estimation
export const mlClient = axios.create({
  baseURL: import.meta.env.VITE_ML_API_BASE_URL || "http://localhost:8000",
});
