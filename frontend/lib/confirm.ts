import { Alert, Platform } from "react-native";

// Alert.alert de React Native no tiene una implementación visual en web
// (react-native-web la deja como no-operativa), así que en ese caso se usa
// window.confirm del navegador. En nativo (iOS/Android) se usa Alert.alert.
export function confirmAsync(
  title: string,
  message: string,
  confirmLabel = "Confirmar",
): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: "destructive",
        onPress: () => resolve(true),
      },
    ]);
  });
}

// Igual que confirmAsync: Alert.alert no muestra nada en web.
export function notify(title: string, message: string): void {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
}
