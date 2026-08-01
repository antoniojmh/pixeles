/**
 * Estados de consola
 */
export const CONSOLE_STATUS = {
  FREE: "free",
  OCCUPIED: "occupied",
  RESERVED: "reserved",
  MAINTENANCE: "maintenance",
};

/**
 * Label humano para cada estado
 */
export const STATUS_LABELS = {
  free: "Libre",
  occupied: "Ocupada",
  reserved: "Reservada",
  maintenance: "Mantenimiento",
};

/**
 * Opciones de duración predefinidas (minutos)
 */
export const DURATION_OPTIONS = [
  { label: "30 min", value: 30 },
  { label: "1 hora", value: 60 },
  { label: "1:30 h", value: 90 },
  { label: "2 horas", value: 120 },
];

/**
 * Colores por estado para las tarjetas
 */
export const STATUS_COLORS = {
  free: {
    border: "var(--status-free)",
    bg: "var(--status-free-bg)",
    text: "var(--status-free)",
  },
  occupied: {
    border: "var(--status-occupied)",
    bg: "var(--status-occupied-bg)",
    text: "var(--status-occupied)",
  },
  reserved: {
    border: "var(--status-reserved)",
    bg: "var(--status-reserved-bg)",
    text: "var(--status-reserved)",
  },
  maintenance: {
    border: "var(--status-maintenance)",
    bg: "var(--status-maintenance-bg)",
    text: "var(--status-maintenance)",
  },
};

/**
 * Precios por defecto (se sobrescriben desde backend)
 */
export const DEFAULT_PRICES = {
  30: 5,
  60: 10,
  90: 14,
  120: 18,
};
