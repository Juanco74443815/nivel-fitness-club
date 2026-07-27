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
  cancelarReserva,
  crearReserva,
  listMisReservas,
  listProgramaciones,
  type ProgramacionClase,
  type ReservaListado,
} from '@/lib/api';
import { confirmAsync, notify } from '@/lib/confirm';
import { formatFecha, formatHora } from '@/lib/format';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Pestana = 'DISPONIBLES' | 'MIS_RESERVAS';

export default function ReservasScreen() {
  const { token, usuario } = useSession();
  const colorScheme = useColorScheme() ?? 'light';
  const puedeConsultar =
    usuario?.rol === 'Administrador' ||
    usuario?.rol === 'Recepcionista' ||
    usuario?.rol === 'Socio';
  const esSocio = usuario?.rol === 'Socio';

  const [pestana, setPestana] = useState<Pestana>('DISPONIBLES');

  const [sesiones, setSesiones] = useState<ProgramacionClase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservando, setReservando] = useState<number | null>(null);

  const [misReservas, setMisReservas] = useState<ReservaListado[]>([]);
  const [cargandoMisReservas, setCargandoMisReservas] = useState(true);
  const [errorMisReservas, setErrorMisReservas] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<number | null>(null);

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

  const cargarMisReservas = useCallback(async () => {
    if (!token || !esSocio) {
      setCargandoMisReservas(false);
      return;
    }

    setCargandoMisReservas(true);
    setErrorMisReservas(null);

    try {
      const data = await listMisReservas(token);
      setMisReservas(data);
    } catch (fetchError) {
      setErrorMisReservas(
        fetchError instanceof ApiError
          ? fetchError.message
          : 'No se pudieron consultar tus reservas.',
      );
    } finally {
      setCargandoMisReservas(false);
    }
  }, [token, esSocio]);

  useFocusEffect(
    useCallback(() => {
      cargarSesiones(true);
      cargarMisReservas();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cargarSesiones, cargarMisReservas]),
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
      cargarMisReservas();
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

  async function handleCancelar(reserva: ReservaListado) {
    const confirmado = await confirmAsync(
      'Cancelar reserva',
      `¿Deseas cancelar tu reserva de ${reserva.clase_nombre} el ${formatFecha(reserva.fecha)}?`,
      'Cancelar reserva',
    );

    if (!confirmado || !token) return;

    setCancelando(reserva.id_reserva);

    try {
      await cancelarReserva(token, reserva.id_reserva);
      await cargarMisReservas();
      cargarSesiones(false);
    } catch (cancelError) {
      notify(
        'No se pudo cancelar',
        cancelError instanceof ApiError
          ? cancelError.message
          : 'Ocurrió un error inesperado.',
      );
    } finally {
      setCancelando(null);
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
        Reservas
      </ThemedText>

      {esSocio && (
        <View style={styles.filtros}>
          {(['DISPONIBLES', 'MIS_RESERVAS'] as Pestana[]).map((opcion) => (
            <Pressable
              key={opcion}
              onPress={() => setPestana(opcion)}
              style={[
                styles.chip,
                {
                  borderColor: Colors[colorScheme].tint,
                  backgroundColor:
                    pestana === opcion ? Colors[colorScheme].tint : 'transparent',
                },
              ]}>
              <ThemedText
                style={{
                  color: pestana === opcion ? '#fff' : Colors[colorScheme].text,
                  fontSize: 13,
                }}>
                {opcion === 'DISPONIBLES' ? 'Disponibles' : 'Mis reservas'}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}

      {pestana === 'DISPONIBLES' || !esSocio ? (
        isLoading ? (
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
        )
      ) : cargandoMisReservas ? (
        <ActivityIndicator style={styles.spacing} />
      ) : errorMisReservas ? (
        <ThemedText style={[styles.spacing, styles.error]}>
          {errorMisReservas}
        </ThemedText>
      ) : (
        <FlatList
          data={misReservas}
          keyExtractor={(item) => String(item.id_reserva)}
          extraData={[cancelando]}
          ListEmptyComponent={
            <ThemedText style={styles.spacing}>
              Todavía no tienes reservas registradas.
            </ThemedText>
          }
          renderItem={({ item }) => {
            const bloqueado = cancelando === item.id_reserva;

            return (
              <View style={[styles.row, { borderColor: Colors[colorScheme].icon }]}>
                <ThemedText type="defaultSemiBold">{item.clase_nombre}</ThemedText>
                <ThemedText>
                  {formatFecha(item.fecha)} · {formatHora(item.hora_inicio)} -{' '}
                  {formatHora(item.hora_fin)}
                </ThemedText>
                <ThemedText>Estado: {item.estado}</ThemedText>

                {item.estado === 'ACTIVA' && (
                  <View style={styles.actions}>
                    <Pressable
                      disabled={bloqueado}
                      onPress={() => handleCancelar(item)}
                      style={styles.actionButton}>
                      {bloqueado ? (
                        <ActivityIndicator size="small" />
                      ) : (
                        <ThemedText style={[styles.actionText, styles.error]}>
                          Cancelar reserva
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
  filtros: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  actionButton: {
    paddingVertical: 4,
  },
  actionText: {
    fontWeight: '600',
  },
  reservarBoton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
});
