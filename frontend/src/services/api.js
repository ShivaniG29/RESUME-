import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api",
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("resume-analyzer-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;
  return typeof detail === "string" ? detail : "Something went wrong. Please try again.";
}
