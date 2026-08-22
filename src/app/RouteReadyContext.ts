import { createContext, useContext, useEffect } from "react";

interface RouteReadyContextValue {
  announce: (message: string) => void;
}

export const RouteReadyContext = createContext<RouteReadyContextValue>({
  announce: () => undefined,
});

export function useRouteReady(
  isReady: boolean,
  message = "Contenido listo",
): void {
  const { announce } = useContext(RouteReadyContext);
  useEffect(() => {
    if (isReady) announce(message);
  }, [announce, isReady, message]);
}
