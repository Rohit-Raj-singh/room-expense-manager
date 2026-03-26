import axios from "axios";

const API_ROOT = import.meta.env.VITE_API_URL || "";
const API_BASE_URL = API_ROOT ? `${API_ROOT.replace(/\/$/, "")}/api` : "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

export function setAuthToken(token) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}

export function getApiErrorMessage(err) {
  return err?.response?.data?.message || err?.message || "Something went wrong";
}

