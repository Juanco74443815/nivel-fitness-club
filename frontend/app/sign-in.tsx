import { useState } from 'react';
import { Link } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useSession } from '@/context/auth-context';
import { ApiError } from '@/lib/api';
import { Colors, Radius, Spacing, cardShadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SignInScreen() {
  const { signIn } = useSession();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!correo.trim() || !password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await signIn(correo.trim(), password);
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : 'No se pudo iniciar sesión. Verifica tu conexión.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.brandBackground }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.outer}>
        <View style={styles.brandBlock}>
          <Image
            source={require('@/assets/images/logo-nivel-fitness.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText style={styles.brandText} lightColor="#EAF2FF" darkColor="#EAF2FF">
            Nivel Fitness Club
          </ThemedText>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface },
            cardShadow(colorScheme),
          ]}>
          <ThemedText type="subtitle" style={styles.title}>
            Inicia sesión
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textMuted }]}>
            Ingresa con tu cuenta para continuar
          </ThemedText>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: colors.textMuted }]}>
              Correo electrónico
            </ThemedText>
            <TextInput
              value={correo}
              onChangeText={setCorreo}
              placeholder="nombre@correo.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
              ]}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: colors.textMuted }]}>
              Contraseña
            </ThemedText>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoComplete="password"
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
              ]}
            />
          </View>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerMuted }]}>
              <ThemedText style={{ color: colors.danger }}>{error}</ThemedText>
            </View>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.tint, opacity: pressed && !isSubmitting ? 0.85 : 1 },
              isSubmitting && styles.buttonDisabled,
            ]}>
            {isSubmitting ? (
              <ActivityIndicator color={colors.tintOn} />
            ) : (
              <ThemedText style={[styles.buttonText, { color: colors.tintOn }]}>
                Iniciar sesión
              </ThemedText>
            )}
          </Pressable>

          <Link href="/recuperar-password" style={styles.link}>
            <ThemedText style={{ color: colors.tint, fontWeight: '600' }}>
              ¿Olvidaste tu contraseña?
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
    gap: Spacing.xl,
    width: '100%',
  },
  brandBlock: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  logo: {
    width: 96,
    height: 96,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  errorBox: {
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  button: {
    borderRadius: Radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  link: {
    alignSelf: 'center',
    marginTop: Spacing.xs,
  },
});
