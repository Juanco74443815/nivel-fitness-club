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
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSession } from '@/context/auth-context';
import { ApiError } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SignInScreen() {
  const { signIn } = useSession();
  const colorScheme = useColorScheme() ?? 'light';

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
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemedView style={styles.container}>
        <Image
          source={require('@/assets/images/logo-nivel-fitness.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText style={styles.subtitle}>Inicia sesión para continuar</ThemedText>

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

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Contraseña"
          placeholderTextColor={Colors[colorScheme].icon}
          secureTextEntry
          autoComplete="password"
          style={[
            styles.input,
            { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon },
          ]}
        />

        {error ? (
          <ThemedText style={styles.error}>{error}</ThemedText>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[styles.button, { backgroundColor: Colors[colorScheme].tint }]}>
          {isSubmitting ? (
            <ActivityIndicator color={colorScheme === 'dark' ? '#000' : '#fff'} />
          ) : (
            <ThemedText
              style={[
                styles.buttonText,
                { color: colorScheme === 'dark' ? '#000' : '#fff' },
              ]}>
              Iniciar sesión
            </ThemedText>
          )}
        </Pressable>

        <Link href="/recuperar-password" style={styles.link}>
          <ThemedText style={{ color: Colors[colorScheme].tint }}>
            ¿Olvidaste tu contraseña?
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
    gap: 12,
  },
  logo: {
    width: 160,
    height: 160,
    alignSelf: 'center',
    borderRadius: 80,
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 12,
    opacity: 0.7,
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
    marginTop: 8,
  },
  buttonText: {
    fontWeight: '600',
  },
  error: {
    color: '#d92626',
    textAlign: 'center',
  },
  link: {
    marginTop: 8,
    alignSelf: 'center',
  },
});
