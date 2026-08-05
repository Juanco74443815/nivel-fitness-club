import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/themed-text';
import { useSession } from '@/context/auth-context';
import { ApiError, obtenerIndicadores, type Indicadores } from '@/lib/api';
import { Colors, Radius, Spacing, cardShadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function PanelScreen() {
  const { token, usuario } = useSession();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const esAdministrador = usuario?.rol === 'Administrador';

  const [indicadores, setIndicadores] = useState<Indicadores | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(
    async (mostrarCargando: boolean) => {
      if (!token || !esAdministrador) {
        setIsLoading(false);
        return;
      }

      if (mostrarCargando) setIsLoading(true);
      setError(null);

      try {
        const data = await obtenerIndicadores(token);
        setIndicadores(data);
      } catch (fetchError) {
        setError(
          fetchError instanceof ApiError
            ? fetchError.message
            : 'No se pudieron consultar los indicadores.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, esAdministrador],
  );

  useFocusEffect(
    useCallback(() => {
      cargar(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cargar]),
  );

  function onRefresh() {
    setIsRefreshing(true);
    cargar(false);
  }

  if (!esAdministrador) {
    return (
      <Screen>
        <ThemedText type="title">Panel</ThemedText>
        <ThemedText style={styles.spacing}>No tienes permisos para ver esta sección.</ThemedText>
      </Screen>
    );
  }

  const tarjetas = [
    { valor: indicadores?.socios_activos ?? 0, etiqueta: 'Socios activos', tono: colors.tint },
    { valor: indicadores?.membresias_vigentes ?? 0, etiqueta: 'Membresías vigentes', tono: colors.accent },
    { valor: indicadores?.reservas_hoy ?? 0, etiqueta: 'Reservas de hoy', tono: colors.success },
    { valor: `Bs. ${indicadores?.ingresos_mes ?? 0}`, etiqueta: 'Ingresos del mes', tono: colors.warning },
  ];

  return (
    <Screen wide>
      <ThemedText type="title" style={styles.spacing}>
        Panel de indicadores
      </ThemedText>

      {isLoading ? (
        <ActivityIndicator style={styles.spacing} />
      ) : error ? (
        <View style={[styles.messageBox, { backgroundColor: colors.dangerMuted }]}>
          <ThemedText style={{ color: colors.danger }}>{error}</ThemedText>
        </View>
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
          <View style={styles.grid}>
            {tarjetas.map((tarjeta) => (
              <View
                key={tarjeta.etiqueta}
                style={[
                  styles.tarjeta,
                  { backgroundColor: colors.surface, borderTopColor: tarjeta.tono },
                  cardShadow(colorScheme),
                ]}>
                <ThemedText style={styles.valor}>{tarjeta.valor}</ThemedText>
                <ThemedText style={{ color: colors.textMuted }}>{tarjeta.etiqueta}</ThemedText>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  tarjeta: {
    borderRadius: Radius.lg,
    borderTopWidth: 3,
    padding: Spacing.lg,
    minWidth: 160,
    flexGrow: 1,
    gap: 4,
  },
  valor: {
    fontSize: 30,
    fontWeight: '700',
  },
});
