import { useState, useCallback } from "react";

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(
    localStorage.getItem("token")
  );

  const setToken = useCallback((newToken: string) => {
    localStorage.setItem("token", newToken);
    setTokenState(newToken);
  }, []);

  const clearToken = useCallback(() => {
    localStorage.removeItem("token");
    setTokenState(null);
  }, []);

  const isAuthenticated = !!token;

  return { token, isAuthenticated, setToken, clearToken };
}
