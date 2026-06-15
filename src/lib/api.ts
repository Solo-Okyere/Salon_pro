import axios, { type AxiosError } from "axios";
import { useAuthStore } from "@/store/slices/authSlice";

const api = axios.create({
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const { data } = await axios.post("/api/auth/refresh", { refreshToken });
        useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken);
        if (original) original.headers!["Authorization"] = `Bearer ${data.accessToken}`;
        return api(original!);
      } catch {
        useAuthStore.getState().clearAuth();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authAPI = {
  sendOTP: (phone: string) => api.post("/api/auth/send-otp", { phone }),
  verifyOTP: (phone: string, otp: string) => api.post("/api/auth/verify-otp", { phone, otp }),
  refresh: (refreshToken: string) => api.post("/api/auth/refresh", { refreshToken }),
  logout: () => api.post("/api/auth/logout"),
};

// Bookings
export const bookingsAPI = {
  create: (data: object) => api.post("/api/bookings", data),
  getAll: (params?: object) => api.get("/api/bookings", { params }),
  getById: (id: string) => api.get(`/api/bookings/${id}`),
  update: (id: string, data: object) => api.patch(`/api/bookings/${id}`, data),
  cancel: (id: string) => api.delete(`/api/bookings/${id}`),
  available: (shopId: string, barberId: string, date: string) =>
    api.get("/api/bookings/available-slots", { params: { shopId, barberId, date } }),
};

// Queue
export const queueAPI = {
  join: (data: object) => api.post("/api/queue/join", data),
  leave: (entryId: string) => api.delete(`/api/queue/${entryId}`),
  status: (shopId: string) => api.get(`/api/queue/status/${shopId}`),
  myPosition: (shopId: string) => api.get(`/api/queue/my-position/${shopId}`),
  call: (entryId: string) => api.patch(`/api/queue/${entryId}/call`),
  complete: (entryId: string) => api.patch(`/api/queue/${entryId}/complete`),
};

// Shops
export const shopsAPI = {
  getAll: () => api.get("/api/shops"),
  getBySlug: (slug: string) => api.get(`/api/shops/${slug}`),
  getBarbers: (shopId: string) => api.get(`/api/shops/${shopId}/barbers`),
  getServices: (shopId: string) => api.get(`/api/shops/${shopId}/services`),
};

// Payments
export const paymentsAPI = {
  initiate: (data: object) => api.post("/api/payments/initiate", data),
  verify: (reference: string) => api.get(`/api/payments/verify/${reference}`),
  history: () => api.get("/api/payments/history"),
};
