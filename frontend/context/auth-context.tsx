import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

import { ApiError, login as apiLogin, logout as apiLogout, type Usuario } from "@/lib/api";
import {
  deleteSecureItem,
  getSecureItem,
  setSecureItem,
} from "@/lib/secure-storage";

const TOKEN_KEY = "nivelfitness_token";
const USUARIO_KEY = "nivelfitness_usuario";

interface AuthContextValue {
  token: string | null;
  usuario: Usuario | null;
  isLoading: boolean;
  signIn: (correo: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useSession(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useSession debe usarse dentro de un AuthProvider");
  }

  return context;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const [storedToken, storedUsuario] = await Promise.all([
        getSecureItem(TOKEN_KEY),
        getSecureItem(USUARIO_KEY),
      ]);

      if (storedToken && storedUsuario) {
        setToken(storedToken);
        setUsuario(JSON.parse(storedUsuario) as Usuario);
      }

      setIsLoading(false);
    }

    restoreSession();
  }, []);

  async function signIn(correo: string, password: string): Promise<void> {
    const result = await apiLogin(correo, password);

    await Promise.all([
      setSecureItem(TOKEN_KEY, result.token),
      setSecureItem(USUARIO_KEY, JSON.stringify(result.usuario)),
    ]);

    setToken(result.token);
    setUsuario(result.usuario);
  }

  async function signOut(): Promise<void> {
    if (token) {
      try {
        await apiLogout(token);
      } catch (error) {
        // Si el token ya expiró o el logout falla en el servidor, igual se
        // cierra la sesión localmente: el usuario no debe quedar bloqueado.
        if (!(error instanceof ApiError)) {
          console.error("Error al cerrar sesión en el servidor:", error);
        }
      }
    }

    await Promise.all([
      deleteSecureItem(TOKEN_KEY),
      deleteSecureItem(USUARIO_KEY),
    ]);

    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ token, usuario, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
