import { useState } from 'react';
import { Link } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ApiError, forgotPassword, resetPassword } from '@/lib/api';
import { Colors, Radius, Spacing, cardShadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RecuperarPasswordScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

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
      style={[styles.flex, { backgroundColor: colors.brandBackground }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.outer}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface },
            cardShadow(colorScheme),
          ]}>
          <ThemedText type="subtitle" style={styles.title}>
            Recuperar contraseña
          </ThemedText>

          <View style={[styles.step, { borderColor: colors.border }]}>
            <ThemedText style={[styles.stepLabel, { color: colors.tint }]}>PASO 1</ThemedText>
            <ThemedText type="defaultSemiBold">Solicitar código</ThemedText>
            <ThemedText style={[styles.hint, { color: colors.textMuted }]}>
              Ingresa tu correo. Si está registrado y activo, se generarán
              instrucciones para restablecer la contraseña.
            </ThemedText>

            <TextInput
              value={correo}
              onChangeText={setCorreo}
              placeholder="Correo electrónico"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
              ]}
            />

            {errorSolicitud ? (
              <View style={[styles.messageBox, { backgroundColor: colors.dangerMuted }]}>
                <ThemedText style={{ color: colors.danger }}>{errorSolicitud}</ThemedText>
              </View>
            ) : null}
            {mensajeSolicitud ? (
              <View style={[styles.messageBox, { backgroundColor: colors.successMuted }]}>
                <ThemedText style={{ color: colors.success }}>{mensajeSolicitud}</ThemedText>
              </View>
            ) : null}

            <Pressable
              onPress={handleSolicitar}
              disabled={enviandoSolicitud}
              style={[styles.button, { backgroundColor: colors.tint }]}>
              {enviandoSolicitud ? (
                <ActivityIndicator color={colors.tintOn} />
              ) : (
                <ThemedText style={[styles.buttonText, { color: colors.tintOn }]}>
                  Enviar instrucciones
                </ThemedText>
              )}
            </Pressable>
          </View>

          <View style={styles.step}>
            <ThemedText style={[styles.stepLabel, { color: colors.tint }]}>PASO 2</ThemedText>
            <ThemedText type="defaultSemiBold">Restablecer con el código recibido</ThemedText>

            <TextInput
              value={token}
              onChangeText={setToken}
              placeholder="Código de recuperación"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
              ]}
            />

            <TextInput
              value={passwordNueva}
              onChangeText={setPasswordNueva}
              placeholder="Nueva contraseña"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
              ]}
            />

            <TextInput
              value={passwordConfirmacion}
              onChangeText={setPasswordConfirmacion}
              placeholder="Confirmar nueva contraseña"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
              ]}
            />

            {errorRestablecer ? (
              <View style={[styles.messageBox, { backgroundColor: colors.dangerMuted }]}>
                <ThemedText style={{ color: colors.danger }}>{errorRestablecer}</ThemedText>
              </View>
            ) : null}
            {mensajeRestablecer ? (
              <View style={[styles.messageBox, { backgroundColor: colors.successMuted }]}>
                <ThemedText style={{ color: colors.success }}>{mensajeRestablecer}</ThemedText>
              </View>
            ) : null}

            <Pressable
              onPress={handleRestablecer}
              disabled={restableciendo}
              style={[styles.button, { backgroundColor: colors.tint }]}>
              {restableciendo ? (
                <ActivityIndicator color={colors.tintOn} />
              ) : (
                <ThemedText style={[styles.buttonText, { color: colors.tintOn }]}>
                  Restablecer contraseña
                </ThemedText>
              )}
            </Pressable>
          </View>

          <Link href="/sign-in" style={styles.link}>
            <ThemedText style={{ color: colors.tint, fontWeight: '600' }}>
              Volver a iniciar sesión
            </ThemedText>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  outer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  step: {
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  messageBox: {
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  button: {
    borderRadius: Radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  link: {
    alignSelf: 'center',
  },
});
