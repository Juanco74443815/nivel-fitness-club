import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSession } from '@/context/auth-context';
import {
  ApiError,
  crearReserva,
  listProgramaciones,
  type ProgramacionClase,
} from '@/lib/api';
import { confirmAsync, notify } from '@/lib/confirm';
import { formatFecha, formatHora } from '@/lib/format';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ReservasScreen() {
  const { token, usuario } = useSession();
  const colorScheme = useColorScheme() ?? 'light';
  const puedeConsultar =
    usuario?.rol === 'Administrador' ||
    usuario?.rol === 'Recepcionista' ||
    usuario?.rol === 'Socio';
  const esSocio = usuario?.rol === 'Socio';

  const [sesiones, setSesiones] = useState<ProgramacionClase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservando, setReservando] = useState<number | null>(null);

  const cargarSesiones = useCallback(
    async (mostrarCargando: boolean) => {
      if (!token || !puedeConsultar) {
        setIsLoading(false);
        return;
      }

      if (mostrarCargando) setIsLoading(true);
      setError(null);

      try {
        const data = await listProgramaciones(token, { estado: 'PROGRAMADA' });
        setSesiones(data);
      } catch (fetchError) {
        setError(
          fetchError instanceof ApiError
            ? fetchError.message
            : 'No se pudieron consultar las sesiones disponibles.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, puedeConsultar],
  );

  useFocusEffect(
    useCallback(() => {
      cargarSesiones(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cargarSesiones]),
  );

  function onRefresh() {
    setIsRefreshing(true);
    cargarSesiones(false);
  }

  async function handleReservar(sesion: ProgramacionClase) {
    const confirmado = await confirmAsync(
      'Reservar sesión',
      `¿Deseas reservar la sesión de ${sesion.clase_nombre} el ${formatFecha(sesion.fecha)} (${formatHora(sesion.hora_inicio)} - ${formatHora(sesion.hora_fin)})?`,
      'Reservar',
    );

    if (!confirmado || !token) return;

    setReservando(sesion.id_programacion);

    try {
      await crearReserva(token, sesion.id_programacion);
      notify('Reserva confirmada', 'Tu reserva se registró correctamente.');
      cargarSesiones(false);
    } catch (reserveError) {
      notify(
        'No se pudo reservar',
        reserveError instanceof ApiError
          ? reserveError.message
          : 'Ocurrió un error inesperado.',
      );
    } finally {
      setReservando(null);
    }
  }

  if (!puedeConsultar) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Reservas</ThemedText>
        <ThemedText style={styles.spacing}>
          No tienes permisos para ver esta sección.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.spacing}>
        Sesiones disponibles
      </ThemedText>

      {isLoading ? (
        <ActivityIndicator style={styles.spacing} />
      ) : error ? (
        <ThemedText style={[styles.spacing, styles.error]}>{error}</ThemedText>
      ) : (
        <FlatList
          data={sesiones}
          keyExtractor={(item) => String(item.id_programacion)}
          extraData={[reservando]}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <ThemedText style={styles.spacing}>
              No hay sesiones programadas por el momento.
            </ThemedText>
          }
          renderItem={({ item }) => {
            const bloqueado = reservando === item.id_programacion;
            const sinCupo = item.cupos_disponibles <= 0;

            return (
              <View style={[styles.row, { borderColor: Colors[colorScheme].icon }]}>
                <ThemedText type="defaultSemiBold">{item.clase_nombre}</ThemedText>
                <ThemedText>
                  {formatFecha(item.fecha)} · {formatHora(item.hora_inicio)} -{' '}
                  {formatHora(item.hora_fin)}
                </ThemedText>
                <ThemedText>
                  Cupos disponibles: {item.cupos_disponibles}/{item.cupo_maximo}
                </ThemedText>

                {esSocio && (
                  <View style={styles.actions}>
                    <Pressable
                      disabled={bloqueado || sinCupo}
                      onPress={() => handleReservar(item)}
                      style={[
                        styles.reservarBoton,
                        {
                          backgroundColor: sinCupo
                            ? Colors[colorScheme].icon
                            : Colors[colorScheme].tint,
                        },
                      ]}>
                      {bloqueado ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <ThemedText style={{ color: '#fff', fontWeight: '600' }}>
                          {sinCupo ? 'Sin cupo' : 'Reservar'}
                        </ThemedText>
                      )}
                    </Pressable>
                  </View>
                )}
              </View>
            );
          }}
        />
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
  row: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 4,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  reservarBoton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
});
