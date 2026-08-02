import { API_URL } from "../env.js";

const BASE = API_URL;

/**
 * Obtiene el token JWT almacenado
 */
function getToken() {
  try {
    return localStorage.getItem("pixeles_token");
  } catch {
    return null;
  }
}

/**
 * Petición base a la API — incluye token JWT automáticamente
 */
async function request(endpoint, options = {}) {
  const token = getToken();
  const url = `${BASE}${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  // Si pasaron headers extra, no los dupliques
  if (options.headers) {
    config.headers = { ...config.headers, ...options.headers };
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, config);

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {}
    throw new Error(message);
  }

  return res.json();
}

/**
 * API - Funciones organizadas por recurso
 */
export const api = {
  // ========== Auth ==========
  login: (username, password) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  register: (data) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: () => request("/api/auth/me"),

  // ========== Consolas ==========
  getConsoles: () => request("/api/consoles"),

  getConsole: (id) => request(`/api/consoles/${id}`),

  createConsole: (data) =>
    request("/api/consoles", { method: "POST", body: JSON.stringify(data) }),

  updateConsole: (id, data) =>
    request(`/api/consoles/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteConsole: (id) =>
    request(`/api/consoles/${id}`, { method: "DELETE" }),

  startSession: (consoleId, data) =>
    request(`/api/consoles/${consoleId}/start`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  endSession: (consoleId) =>
    request(`/api/consoles/${consoleId}/end`, { method: "POST" }),

  pauseSession: (consoleId) =>
    request(`/api/consoles/${consoleId}/pause`, { method: "POST" }),

  resumeSession: (consoleId) =>
    request(`/api/consoles/${consoleId}/resume`, { method: "POST" }),

  addTime: (consoleId, minutes) =>
    request(`/api/consoles/${consoleId}/add-time`, {
      method: "POST",
      body: JSON.stringify({ minutes }),
    }),

  setConsoleStatus: (consoleId, status) =>
    request(`/api/consoles/${consoleId}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),

  reserveConsole: (consoleId, data) =>
    request(`/api/consoles/${consoleId}/reserve`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  releaseReservation: (consoleId) =>
    request(`/api/consoles/${consoleId}/release`, { method: "POST" }),

  toggleMaintenance: (consoleId) =>
    request(`/api/consoles/${consoleId}/maintenance`, { method: "POST" }),

  // ========== Sesiones ==========
  getSessions: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, v);
    });
    const query = qs.toString();
    return request(`/api/sessions${query ? "?" + query : ""}`);
  },

  getSession: (id) => request(`/api/sessions/${id}`),

  // ========== Juegos ==========
  getGames: () => request("/api/games"),

  createGame: (data) =>
    request("/api/games", { method: "POST", body: JSON.stringify(data) }),

  updateGame: (id, data) =>
    request(`/api/games/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteGame: (id) =>
    request(`/api/games/${id}`, { method: "DELETE" }),

  // ========== Reportes ==========
  getDailyReport: (date) =>
    request(`/api/reports/daily?date=${date || ""}`),

  getMonthlyReport: (year, month) =>
    request(`/api/reports/monthly?year=${year || ""}&month=${month || ""}`),

  getStats: () => request("/api/reports/stats"),

  getTopGames: (limit = 10) =>
    request(`/api/reports/top-games?limit=${limit}`),

  getTopConsoles: (limit = 10) =>
    request(`/api/reports/top-consoles?limit=${limit}`),

  // ========== Products ==========
  getProducts: () => request("/api/products"),

  createProduct: (data) =>
    request("/api/products", { method: "POST", body: JSON.stringify(data) }),

  updateProduct: (id, data) =>
    request(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteProduct: (id) =>
    request(`/api/products/${id}`, { method: "DELETE" }),

  // ========== Branches ==========
  getBranches: () => request("/api/branches"),

  createBranch: (data) =>
    request("/api/branches", { method: "POST", body: JSON.stringify(data) }),

  updateBranch: (id, data) =>
    request(`/api/branches/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteBranch: (id) =>
    request(`/api/branches/${id}`, { method: "DELETE" }),

  // ========== Settings ==========
  getSettings: () => request("/api/settings"),

  updateSetting: (key, value) =>
    request("/api/settings", {
      method: "PUT",
      body: JSON.stringify({ key, value }),
    }),
};
