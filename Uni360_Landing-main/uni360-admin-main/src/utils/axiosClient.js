import axios from "axios";
import { getAccessToken } from "./tokenStore";

const axiosClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/v1`, // ✅ FIXED
  headers: {
    "Content-Type": "application/json",
  },
});

// Inject token automatically
axiosClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosClient;
