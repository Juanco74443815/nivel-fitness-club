import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// expo-secure-store no funciona en web (usa Keychain/Keystore nativos), así
// que en web se usa localStorage como respaldo. En un app real de producción
// esto expondría el token a XSS; aceptable aquí porque el foco del proyecto
// es la app móvil (React Native), y web solo se usa para desarrollo rápido.
export async function setSecureItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

export async function getSecureItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}
