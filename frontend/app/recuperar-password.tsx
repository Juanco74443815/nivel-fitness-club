import { useState } from 'react';
import { Link } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ApiError, forgotPassword, resetPassword } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RecuperarPasswordScreen() {
  const colorScheme = useColorScheme() ?? 'light';

  const [correo, setCorreo] = useState('');
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [mensajeSolicitud, setMensajeSolicitud] = useState<string | null>(null);
  const [errorSolicitud, setErrorSolicitud] = useState<string | null>(null);

  const [token, setToken] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmacion, setPasswordConfirmacion] = useState('');
  const [restableciendo, setRestableciendo] = useState(false);
  const [mensajeRestablecer, setMensajeRestablecer] = useState<string | null>(null);
  const [errorRestablecer, setErrorRestablecer] = useState<string | null>(null);

  async function handleSolicitar() {
    if (!correo.trim()) {
      setErrorSolicitud('Ingresa tu correo electrónico.');
      return;
    }

    setErrorSolicitud(null);
    setMensajeSolicitud(null);
    setEnviandoSolicitud(true);

    try {
      const mensaje = await forgotPassword(correo.trim());
      setMensajeSolicitud(mensaje);
    } catch (submitError) {
      setErrorSolicitud(
        submitError instanceof ApiError
          ? submitError.message
          : 'No se pudo procesar la solicitud. Verifica tu conexión.',
      );
    } finally {
      setEnviandoSolicitud(false);
    }
  }

  async function handleRestablecer() {
    if (!token.trim() || !passwordNueva || !passwordConfirmacion) {
      setErrorRestablecer('Completa el código y la nueva contraseña.');
      return;
    }

    if (passwordNueva !== passwordConfirmacion) {
      setErrorRestablecer('Las contraseñas no coinciden.');
      return;
    }

    setErrorRestablecer(null);
    setMensajeRestablecer(null);
    setRestableciendo(true);

    try {
      const mensaje = await resetPassword(token.trim(), passwordNueva);
      setMensajeRestablecer(mensaje);
      setToken('');
      setPasswordNueva('');
      setPasswordConfirmacion('');
    } catch (submitError) {
      setErrorRestablecer(
        submitError instanceof ApiError
          ? submitError.message
          : 'No se pudo restablecer la contraseña. Verifica tu conexión.',
      );
    } finally {
      setRestableciendo(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Recuperar contraseña
        </ThemedText>

        <ThemedText type="defaultSemiBold">1. Solicitar código</ThemedText>
        <ThemedText style={styles.hint}>
          Ingresa tu correo. Si está registrado y activo, se generarán
          instrucciones para restablecer la contraseña.
        </ThemedText>

        <TextInput
          value={correo}
          onChangeText={setCorreo}
          placeholder="Correo electrónico"
          placeholderTextColor={Colors[colorScheme].icon}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          style={[
            styles.input,
            { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon },
          ]}
        />

        {errorSolicitud ? (
          <ThemedText style={styles.error}>{errorSolicitud}</ThemedText>
        ) : null}
        {mensajeSolicitud ? (
          <ThemedText style={styles.success}>{mensajeSolicitud}</ThemedText>
        ) : null}

        <Pressable
          onPress={handleSolicitar}
          disabled={enviandoSolicitud}
          style={[styles.button, { backgroundColor: Colors[colorScheme].tint }]}>
          {enviandoSolicitud ? (
            <ActivityIndicator color={colorScheme === 'dark' ? '#000' : '#fff'} />
          ) : (
            <ThemedText
              style={[
                styles.buttonText,
                { color: colorScheme === 'dark' ? '#000' : '#fff' },
              ]}>
              Enviar instrucciones
            </ThemedText>
          )}
        </Pressable>

        <ThemedText type="defaultSemiBold" style={styles.spacingTop}>
          2. Restablecer con el código recibido
        </ThemedText>

        <TextInput
          value={token}
          onChangeText={setToken}
          placeholder="Código de recuperación"
          placeholderTextColor={Colors[colorScheme].icon}
          autoCapitalize="none"
          style={[
            styles.input,
            { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon },
          ]}
        />

        <TextInput
          value={passwordNueva}
          onChangeText={setPasswordNueva}
          placeholder="Nueva contraseña"
          placeholderTextColor={Colors[colorScheme].icon}
          secureTextEntry
          style={[
            styles.input,
            { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon },
          ]}
        />

        <TextInput
          value={passwordConfirmacion}
          onChangeText={setPasswordConfirmacion}
          placeholder="Confirmar nueva contraseña"
          placeholderTextColor={Colors[colorScheme].icon}
          secureTextEntry
          style={[
            styles.input,
            { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon },
          ]}
        />

        {errorRestablecer ? (
          <ThemedText style={styles.error}>{errorRestablecer}</ThemedText>
        ) : null}
        {mensajeRestablecer ? (
          <ThemedText style={styles.success}>{mensajeRestablecer}</ThemedText>
        ) : null}

        <Pressable
          onPress={handleRestablecer}
          disabled={restableciendo}
          style={[styles.button, { backgroundColor: Colors[colorScheme].tint }]}>
          {restableciendo ? (
            <ActivityIndicator color={colorScheme === 'dark' ? '#000' : '#fff'} />
          ) : (
            <ThemedText
              style={[
                styles.buttonText,
                { color: colorScheme === 'dark' ? '#000' : '#fff' },
              ]}>
              Restablecer contraseña
            </ThemedText>
          )}
        </Pressable>

        <Link href="/sign-in" style={styles.link}>
          <ThemedText style={{ color: Colors[colorScheme].tint }}>
            Volver a iniciar sesión
          </ThemedText>
        </Link>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 10,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    opacity: 0.7,
    fontSize: 13,
  },
  spacingTop: {
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    fontWeight: '600',
  },
  error: {
    color: '#d92626',
    textAlign: 'center',
  },
  success: {
    color: '#2e9e4f',
    textAlign: 'center',
  },
  link: {
    marginTop: 16,
    alignSelf: 'center',
  },
});
