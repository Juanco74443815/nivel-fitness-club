import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSession } from '@/context/auth-context';
import { ApiError, obtenerIndicadores, type Indicadores } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function PanelScreen() {
  const { token, usuario } = useSession();
  const colorScheme = useColorScheme() ?? 'light';
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
      <ThemedView style={styles.container}>
        <ThemedText type="title">Panel</ThemedText>
        <ThemedText style={styles.spacing}>No tienes permisos para ver esta sección.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.spacing}>
        Panel de indicadores
      </ThemedText>

      {isLoading ? (
        <ActivityIndicator style={styles.spacing} />
      ) : error ? (
        <ThemedText style={[styles.spacing, styles.error]}>{error}</ThemedText>
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
          <View style={styles.grid}>
            <View style={[styles.tarjeta, { borderColor: Colors[colorScheme].icon }]}>
              <ThemedText style={styles.valor}>{indicadores?.socios_activos ?? 0}</ThemedText>
              <ThemedText>Socios activos</ThemedText>
            </View>
            <View style={[styles.tarjeta, { borderColor: Colors[colorScheme].icon }]}>
              <ThemedText style={styles.valor}>{indicadores?.membresias_vigentes ?? 0}</ThemedText>
              <ThemedText>Membresías vigentes</ThemedText>
            </View>
            <View style={[styles.tarjeta, { borderColor: Colors[colorScheme].icon }]}>
              <ThemedText style={styles.valor}>{indicadores?.reservas_hoy ?? 0}</ThemedText>
              <ThemedText>Reservas de hoy</ThemedText>
            </View>
            <View style={[styles.tarjeta, { borderColor: Colors[colorScheme].icon }]}>
              <ThemedText style={styles.valor}>Bs. {indicadores?.ingresos_mes ?? 0}</ThemedText>
              <ThemedText>Ingresos del mes</ThemedText>
            </View>
          </View>
        </ScrollView>
      )}
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
    marginBottom: 16,
  },
  error: {
    color: '#d92626',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tarjeta: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    minWidth: 140,
    flexGrow: 1,
    gap: 4,
  },
  valor: {
    fontSize: 28,
    fontWeight: '700',
  },
});
