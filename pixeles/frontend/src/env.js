// URL base de la API. En producción se inyecta con VITE_API_URL (Render).
// En desarrollo cae al proxy de Vite (localhost:4000).
export const API_URL = import.meta.env.VITE_API_URL || "";
