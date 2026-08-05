import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/themed-text';
import { useSession } from '@/context/auth-context';
import { ApiError, getPerfil, type Perfil } from '@/lib/api';
import { Colors, Radius, Spacing, cardShadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function PerfilScreen() {
  const { token, signOut } = useSession();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

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

  const iniciales = perfil
    ? `${perfil.nombres.charAt(0)}${perfil.apellidos.charAt(0)}`.toUpperCase()
    : '';

  return (
    <Screen>
      <ThemedText type="title" style={styles.spacing}>
        Mi perfil
      </ThemedText>

      {isLoading ? (
        <ActivityIndicator style={styles.spacing} />
      ) : error ? (
        <View style={[styles.messageBox, { backgroundColor: colors.dangerMuted }]}>
          <ThemedText style={{ color: colors.danger }}>{error}</ThemedText>
        </View>
      ) : perfil ? (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface },
            cardShadow(colorScheme),
          ]}>
          <View style={styles.headerRow}>
            <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
              <ThemedText style={[styles.avatarText, { color: colors.tintOn }]}>
                {iniciales}
              </ThemedText>
            </View>
            <View style={styles.headerText}>
              <ThemedText type="subtitle">
                {perfil.nombres} {perfil.apellidos}
              </ThemedText>
              <ThemedText style={{ color: colors.textMuted }}>{perfil.rol}</ThemedText>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.datos}>
            <View style={styles.dato}>
              <ThemedText style={[styles.datoLabel, { color: colors.textMuted }]}>
                Correo
              </ThemedText>
              <ThemedText>{perfil.correo}</ThemedText>
            </View>
            {perfil.telefono ? (
              <View style={styles.dato}>
                <ThemedText style={[styles.datoLabel, { color: colors.textMuted }]}>
                  Teléfono
                </ThemedText>
                <ThemedText>{perfil.telefono}</ThemedText>
              </View>
            ) : null}
            <View style={styles.dato}>
              <ThemedText style={[styles.datoLabel, { color: colors.textMuted }]}>
                Estado
              </ThemedText>
              <Badge estado={perfil.estado} />
            </View>
          </View>
        </View>
      ) : null}

      <Pressable
        style={[styles.logoutButton, { borderColor: colors.danger }]}
        onPress={signOut}>
        <ThemedText style={[styles.logoutText, { color: colors.danger }]}>
          Cerrar sesión
        </ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  spacing: {
    marginBottom: Spacing.lg,
  },
  messageBox: {
    borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerText: {
    gap: 2,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.lg,
  },
  datos: {
    gap: Spacing.md,
  },
  dato: {
    gap: 2,
  },
  datoLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  logoutButton: {
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontWeight: '700',
  },
});
