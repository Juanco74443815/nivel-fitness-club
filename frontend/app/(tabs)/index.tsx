import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSession } from '@/context/auth-context';
import { ApiError, getPerfil, type Perfil } from '@/lib/api';

export default function PerfilScreen() {
  const { token, signOut } = useSession();

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const cargarPerfil = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getPerfil(token);
      setPerfil(data);
    } catch (fetchError) {
      setError(
        fetchError instanceof ApiError
          ? fetchError.message
          : 'No se pudo consultar el perfil.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      cargarPerfil();
    }, [cargarPerfil]),
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Mi perfil</ThemedText>

      {isLoading ? (
        <ActivityIndicator style={styles.spacing} />
      ) : error ? (
        <ThemedText style={[styles.spacing, styles.error]}>{error}</ThemedText>
      ) : perfil ? (
        <ThemedView style={styles.spacing}>
          <ThemedText type="subtitle">
            {perfil.nombres} {perfil.apellidos}
          </ThemedText>
          <ThemedText>Correo: {perfil.correo}</ThemedText>
          <ThemedText>Rol: {perfil.rol}</ThemedText>
          <ThemedText>Estado: {perfil.estado}</ThemedText>
          {perfil.telefono ? <ThemedText>Teléfono: {perfil.telefono}</ThemedText> : null}
        </ThemedView>
      ) : null}

      <Pressable style={styles.logoutButton} onPress={signOut}>
        <ThemedText style={styles.logoutText}>Cerrar sesión</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
  },
  spacing: {
    marginTop: 20,
    gap: 6,
  },
  error: {
    color: '#d92626',
  },
  logoutButton: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#d92626',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#d92626',
    fontWeight: '600',
  },
});
