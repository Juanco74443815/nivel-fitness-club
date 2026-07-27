import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSession } from '@/context/auth-context';
import {
  ApiError,
  cambiarEstadoMembresia,
  crearMembresia,
  listMembresias,
  listPlanesMembresia,
  listSocios,
  renovarMembresia,
  type Membresia,
  type PlanMembresia,
  type SocioListado,
} from '@/lib/api';
import { confirmAsync, notify } from '@/lib/confirm';
import { formatFecha } from '@/lib/format';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const ESTADOS = ['PENDIENTE', 'ACTIVA', 'VENCIDA', 'SUSPENDIDA', 'ANULADA'] as const;

export default function MembresiasScreen() {
  const { token, usuario } = useSession();
  const colorScheme = useColorScheme() ?? 'light';
  const puedeGestionar =
    usuario?.rol === 'Administrador' || usuario?.rol === 'Recepcionista';
  const puedeConsultar = puedeGestionar || usuario?.rol === 'Socio';

  const [membresias, setMembresias] = useState<Membresia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<number | null>(null);

  const [mostrarFormularioNuevo, setMostrarFormularioNuevo] = useState(false);
  const [busquedaSocio, setBusquedaSocio] = useState('');
  const [resultadosSocio, setResultadosSocio] = useState<SocioListado[]>([]);
  const [socioSeleccionado, setSocioSeleccionado] = useState<SocioListado | null>(null);
  const [planes, setPlanes] = useState<PlanMembresia[]>([]);
  const [planSeleccionado, setPlanSeleccionado] = useState<PlanMembresia | null>(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [creando, setCreando] = useState(false);

  const [filaEditandoEstado, setFilaEditandoEstado] = useState<number | null>(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<string>('ACTIVA');
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  const cargarMembresias = useCallback(
    async (mostrarCargando: boolean) => {
      if (!token || !puedeConsultar) {
        setIsLoading(false);
        return;
      }

      if (mostrarCargando) setIsLoading(true);
      setError(null);

      try {
        const data = await listMembresias(token);
        setMembresias(data);
      } catch (fetchError) {
        setError(
          fetchError instanceof ApiError
            ? fetchError.message
            : 'No se pudieron consultar las membresías.',
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
      cargarMembresias(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cargarMembresias]),
  );

  function onRefresh() {
    setIsRefreshing(true);
    cargarMembresias(false);
  }

  async function handleBuscarSocio() {
    if (!token || !busquedaSocio.trim()) {
      setResultadosSocio([]);
      return;
    }

    try {
      const data = await listSocios(token, { estado: 'ACTIVO', q: busquedaSocio.trim() });
      setResultadosSocio(data);
    } catch {
      setResultadosSocio([]);
    }
  }

  async function abrirFormularioNuevo() {
    setMostrarFormularioNuevo((v) => !v);

    if (!token || planes.length > 0) return;

    try {
      const data = await listPlanesMembresia(token, { estado: 'ACTIVO' });
      setPlanes(data);
    } catch {
      setPlanes([]);
    }
  }

  async function handleCrearMembresia() {
    if (!token || !socioSeleccionado || !planSeleccionado || !fechaInicio.trim()) {
      notify(
        'Datos incompletos',
        'Selecciona un socio, un plan y una fecha de inicio (AAAA-MM-DD).',
      );
      return;
    }

    setCreando(true);

    try {
      await crearMembresia(token, {
        id_socio: socioSeleccionado.id_socio,
        id_plan: planSeleccionado.id_plan,
        fecha_inicio: fechaInicio.trim(),
      });
      setMostrarFormularioNuevo(false);
      setSocioSeleccionado(null);
      setPlanSeleccionado(null);
      setFechaInicio('');
      setBusquedaSocio('');
      setResultadosSocio([]);
      cargarMembresias(false);
    } catch (createError) {
      notify(
        'No se pudo registrar la membresía',
        createError instanceof ApiError
          ? createError.message
          : 'Ocurrió un error inesperado.',
      );
    } finally {
      setCreando(false);
    }
  }

  async function handleRenovar(membresia: Membresia) {
    if (!token) return;

    const confirmado = await confirmAsync(
      'Renovar membresía',
      `¿Renovar la membresía de ${membresia.socio_nombres} ${membresia.socio_apellidos} por otro periodo de "${membresia.plan_nombre}"?`,
      'Renovar',
    );

    if (!confirmado) return;

    setProcesando(membresia.id_membresia);

    try {
      const actualizada = await renovarMembresia(token, membresia.id_membresia);
      setMembresias((prev) =>
        prev.map((m) => (m.id_membresia === membresia.id_membresia ? actualizada : m)),
      );
    } catch (renewError) {
      notify(
        'No se pudo renovar',
        renewError instanceof ApiError
          ? renewError.message
          : 'Ocurrió un error inesperado.',
      );
    } finally {
      setProcesando(null);
    }
  }

  function iniciarCambioEstado(membresia: Membresia) {
    setFilaEditandoEstado(membresia.id_membresia);
    setEstadoSeleccionado(membresia.estado);
    setMotivoAnulacion('');
  }

  async function handleGuardarEstado(idMembresia: number) {
    if (!token) return;

    if (estadoSeleccionado === 'ANULADA' && !motivoAnulacion.trim()) {
      notify('Motivo requerido', 'Debes indicar el motivo para anular la membresía.');
      return;
    }

    setProcesando(idMembresia);

    try {
      const actualizada = await cambiarEstadoMembresia(token, idMembresia, {
        estado: estadoSeleccionado,
        motivo_anulacion: estadoSeleccionado === 'ANULADA' ? motivoAnulacion.trim() : undefined,
      });
      setMembresias((prev) =>
        prev.map((m) => (m.id_membresia === idMembresia ? actualizada : m)),
      );
      setFilaEditandoEstado(null);
    } catch (updateError) {
      notify(
        'No se pudo cambiar el estado',
        updateError instanceof ApiError
          ? updateError.message
          : 'Ocurrió un error inesperado.',
      );
    } finally {
      setProcesando(null);
    }
  }

  if (!puedeConsultar) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Membresías</ThemedText>
        <ThemedText style={styles.spacing}>
          No tienes permisos para ver esta sección.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.spacing}>
        Membresías
      </ThemedText>

      {puedeGestionar && (
        <Pressable
          onPress={abrirFormularioNuevo}
          style={[styles.nuevoBoton, { borderColor: Colors[colorScheme].tint }]}>
          <ThemedText style={{ color: Colors[colorScheme].tint, fontWeight: '600' }}>
            {mostrarFormularioNuevo ? 'Cancelar' : '+ Nueva membresía'}
          </ThemedText>
        </Pressable>
      )}

      {mostrarFormularioNuevo && (
        <View style={[styles.formulario, { borderColor: Colors[colorScheme].icon }]}>
          <ThemedText type="defaultSemiBold">1. Buscar socio</ThemedText>
          <TextInput
            value={busquedaSocio}
            onChangeText={setBusquedaSocio}
            onSubmitEditing={handleBuscarSocio}
            placeholder="Nombre, CI o código del socio"
            placeholderTextColor={Colors[colorScheme].icon}
            style={[styles.input, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon }]}
          />
          {socioSeleccionado ? (
            <ThemedText>
              Seleccionado: {socioSeleccionado.nombres} {socioSeleccionado.apellidos} (
              {socioSeleccionado.codigo_socio})
            </ThemedText>
          ) : (
            resultadosSocio.map((s) => (
              <Pressable
                key={s.id_socio}
                onPress={() => {
                  setSocioSeleccionado(s);
                  setResultadosSocio([]);
                }}
                style={[styles.resultadoRow, { borderColor: Colors[colorScheme].icon }]}>
                <ThemedText>
                  {s.nombres} {s.apellidos} ({s.codigo_socio})
                </ThemedText>
              </Pressable>
            ))
          )}

          <ThemedText type="defaultSemiBold" style={styles.spacingTop}>
            2. Elegir plan
          </ThemedText>
          <View style={styles.filtros}>
            {planes.map((p) => (
              <Pressable
                key={p.id_plan}
                onPress={() => setPlanSeleccionado(p)}
                style={[
                  styles.chip,
                  {
                    borderColor: Colors[colorScheme].tint,
                    backgroundColor:
                      planSeleccionado?.id_plan === p.id_plan
                        ? Colors[colorScheme].tint
                        : 'transparent',
                  },
                ]}>
                <ThemedText
                  style={{
                    color:
                      planSeleccionado?.id_plan === p.id_plan
                        ? '#fff'
                        : Colors[colorScheme].text,
                    fontSize: 13,
                  }}>
                  {p.nombre} ({p.duracion_dias}d · Bs. {p.precio})
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <ThemedText type="defaultSemiBold" style={styles.spacingTop}>
            3. Fecha de inicio
          </ThemedText>
          <TextInput
            value={fechaInicio}
            onChangeText={setFechaInicio}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={Colors[colorScheme].icon}
            style={[styles.input, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon }]}
          />

          <Pressable
            disabled={creando}
            onPress={handleCrearMembresia}
            style={[styles.guardarBoton, { backgroundColor: Colors[colorScheme].tint }]}>
            {creando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={{ color: '#fff', fontWeight: '600' }}>
                Registrar membresía
              </ThemedText>
            )}
          </Pressable>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator style={styles.spacing} />
      ) : error ? (
        <ThemedText style={[styles.spacing, styles.error]}>{error}</ThemedText>
      ) : (
        <FlatList
          data={membresias}
          keyExtractor={(item) => String(item.id_membresia)}
          extraData={[procesando, filaEditandoEstado, estadoSeleccionado, motivoAnulacion]}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <ThemedText style={styles.spacing}>
              {puedeGestionar
                ? 'No se encontraron membresías.'
                : 'No tienes una membresía vigente.'}
            </ThemedText>
          }
          renderItem={({ item }) => {
            const bloqueado = procesando === item.id_membresia;
            const editandoEstado = filaEditandoEstado === item.id_membresia;

            return (
              <View style={[styles.row, { borderColor: Colors[colorScheme].icon }]}>
                {puedeGestionar && (
                  <ThemedText type="defaultSemiBold">
                    {item.socio_nombres} {item.socio_apellidos} ({item.codigo_socio})
                  </ThemedText>
                )}
                <ThemedText>Plan: {item.plan_nombre}</ThemedText>
                <ThemedText>
                  Vigencia: {formatFecha(item.fecha_inicio)} a {formatFecha(item.fecha_fin)}
                </ThemedText>
                <ThemedText>Estado: {item.estado}</ThemedText>
                {item.proxima_a_vencer && (
                  <ThemedText style={styles.aviso}>Próxima a vencer</ThemedText>
                )}
                {item.motivo_anulacion && (
                  <ThemedText>Motivo de anulación: {item.motivo_anulacion}</ThemedText>
                )}

                {puedeGestionar && !editandoEstado && (
                  <View style={styles.actions}>
                    <Pressable
                      disabled={bloqueado}
                      onPress={() => handleRenovar(item)}
                      style={styles.actionButton}>
                      {bloqueado ? (
                        <ActivityIndicator size="small" />
                      ) : (
                        <ThemedText style={styles.actionText}>Renovar</ThemedText>
                      )}
                    </Pressable>
                    <Pressable
                      disabled={bloqueado}
                      onPress={() => iniciarCambioEstado(item)}
                      style={styles.actionButton}>
                      <ThemedText style={styles.actionText}>Cambiar estado</ThemedText>
                    </Pressable>
                  </View>
                )}

                {editandoEstado && (
                  <View style={styles.formulario}>
                    <View style={styles.filtros}>
                      {ESTADOS.map((estado) => (
                        <Pressable
                          key={estado}
                          onPress={() => setEstadoSeleccionado(estado)}
                          style={[
                            styles.chip,
                            {
                              borderColor: Colors[colorScheme].tint,
                              backgroundColor:
                                estadoSeleccionado === estado
                                  ? Colors[colorScheme].tint
                                  : 'transparent',
                            },
                          ]}>
                          <ThemedText
                            style={{
                              color:
                                estadoSeleccionado === estado
                                  ? '#fff'
                                  : Colors[colorScheme].text,
                              fontSize: 12,
                            }}>
                            {estado}
                          </ThemedText>
                        </Pressable>
                      ))}
                    </View>

                    {estadoSeleccionado === 'ANULADA' && (
                      <TextInput
                        value={motivoAnulacion}
                        onChangeText={setMotivoAnulacion}
                        placeholder="Motivo de anulación *"
                        placeholderTextColor={Colors[colorScheme].icon}
                        style={[styles.input, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon }]}
                      />
                    )}

                    <View style={styles.actions}>
                      <Pressable
                        disabled={bloqueado}
                        onPress={() => handleGuardarEstado(item.id_membresia)}
                        style={styles.actionButton}>
                        {bloqueado ? (
                          <ActivityIndicator size="small" />
                        ) : (
                          <ThemedText style={styles.actionText}>Guardar</ThemedText>
                        )}
                      </Pressable>
                      <Pressable
                        disabled={bloqueado}
                        onPress={() => setFilaEditandoEstado(null)}
                        style={styles.actionButton}>
                        <ThemedText style={styles.actionText}>Cancelar</ThemedText>
                      </Pressable>
                    </View>
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
  spacingTop: {
    marginTop: 12,
  },
  filtros: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  nuevoBoton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  formulario: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  resultadoRow: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  guardarBoton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  error: {
    color: '#d92626',
  },
  aviso: {
    color: '#b8860b',
    fontWeight: '600',
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
    gap: 16,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingVertical: 4,
  },
  actionText: {
    fontWeight: '600',
  },
});
