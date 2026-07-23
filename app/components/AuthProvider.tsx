import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router";
import { AuthModal } from "./AuthModal";

type AuthMode = "login" | "register";

interface AuthContextType {
  openLogin: () => void;
  openRegister: () => void;
}

const AuthContext = createContext<AuthContextType>({
  openLogin: () => {},
  openRegister: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function AuthWatcher({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  // Open from ?auth= param
  useEffect(() => {
    const authParam = new URLSearchParams(location.search).get("auth");
    if (authParam === "login") { setMode("login"); setOpen(true); }
    else if (authParam === "register") { setMode("register"); setOpen(true); }
  }, [location.search]);

  const openLogin = useCallback(() => { setMode("login"); setOpen(true); }, []);
  const openRegister = useCallback(() => { setMode("register"); setOpen(true); }, []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <AuthContext.Provider value={{ openLogin, openRegister }}>
      {children}
      <AuthModal open={open} mode={mode} onClose={close} onSwitchMode={setMode} />
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthWatcher>{children}</AuthWatcher>;
}
