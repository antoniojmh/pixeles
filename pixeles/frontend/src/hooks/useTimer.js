import { useState, useEffect, useRef } from "react";

/**
 * Hook de temporizador local
 *
 * Calcula el tiempo restante a partir de un endTime (ISO string)
 * y un serverTime (ISO string) para sincronización.
 *
 * Retorna:
 * - remaining: ms restantes
 * - formatted: string mm:ss
 * - isTimeUp: boolean
 * - isNearEnd: boolean (menos de 5 min)
 * - progress: porcentaje 0-100
 */
export function useTimer(endTime, startTime, durationMinutes) {
  const [remaining, setRemaining] = useState(null);
  const [startOffset, setStartOffset] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Si no hay endTime, no hay temporizador
    if (!endTime) {
      setRemaining(null);
      return;
    }

    const endMs = new Date(endTime).getTime();

    function update() {
      const now = Date.now();
      const diff = Math.max(0, endMs - now);
      setRemaining(diff);

      if (diff <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Actualizar inmediato
    update();

    // Actualizar cada segundo
    intervalRef.current = setInterval(update, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [endTime]);

  // Calcular progreso (0-100)
  let progress = 0;
  if (remaining != null && durationMinutes && endTime && startTime) {
    const total = durationMinutes * 60 * 1000;
    if (total > 0) {
      const elapsed = total - remaining;
      progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
    }
  }

  const isTimeUp = remaining != null && remaining <= 0;
  const isNearEnd = remaining != null && remaining > 0 && remaining <= 5 * 60 * 1000;

  // Formatear a mm:ss
  const formatted = (() => {
    if (remaining == null) return "--:--";
    const totalSec = Math.floor(remaining / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  })();

  return { remaining, formatted, isTimeUp, isNearEnd, progress };
}
