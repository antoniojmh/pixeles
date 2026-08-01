import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../env.js";

/**
 * Hook personalizado para conexión Socket.io
 *
 * Retorna:
 * - socket: instancia del socket
 * - connected: booleano
 * - on: función para escuchar eventos
 * - off: función para dejar de escuchar
 */
export function useSocket() {
  const socketRef = useRef(null);
  const connectedRef = useRef(false);
  const listenersRef = useRef(new Map());

  useEffect(() => {
    const socket = io(API_URL || undefined, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      console.log("[Socket] Conectado ✅");
      connectedRef.current = true;
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Desconectado:", reason);
      connectedRef.current = false;
    });

    socket.on("connect_error", (err) => {
      console.warn("[Socket] Error de conexión:", err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.removeAllListeners();
      socket.close();
      socketRef.current = null;
      connectedRef.current = false;
    };
  }, []);

  const on = useCallback((event, handler) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, []);

  const off = useCallback((event, handler) => {
    socketRef.current?.off(event, handler);
  }, []);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return {
    socket: socketRef.current,
    connected: connectedRef.current,
    on,
    off,
    emit,
  };
}
