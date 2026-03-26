import { useEffect, useMemo, useRef } from "react";
import { io } from "socket.io-client";

export function useSocket({ token, onExpenseUpdated }) {
  const onExpenseUpdatedRef = useRef(onExpenseUpdated);
  onExpenseUpdatedRef.current = onExpenseUpdated;

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "";

  const socket = useMemo(() => {
    if (!token) return null;
    return io(SOCKET_URL || "/", {
      auth: { token },
      transports: ["websocket"]
    });
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    const handleExpenseUpdated = (payload) => {
      onExpenseUpdatedRef.current?.(payload);
    };

    socket.on("expenseUpdated", handleExpenseUpdated);
    return () => {
      socket.off("expenseUpdated", handleExpenseUpdated);
      socket.disconnect();
    };
  }, [socket]);

  return socket;
}

