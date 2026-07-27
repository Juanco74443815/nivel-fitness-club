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
  actualizarPlanMembresia,
  ApiError,
  crearPlanMembresia,
  desactivarPlanMembresia,
  listPlanesMembresia,
  type PlanMembresia,
} from '@/lib/api';
import { confirmAsync, notify } from '@/lib/confirm';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type FiltroEstado = 'TODOS' | 'ACTIVO' | 'INACTIVO';

interface FormularioPlan {
  nombre: string;
  descripcion: string;
  duracion_dias: string;
  precio: string;
}

const FORMULARIO_VACIO: FormularioPlan = {
  nombre: '',
  descripcion: '',
  duracion_dias: '',
  precio: '',
};

export default function PlanesMembresiaScreen() {
  const { token, usuario } = useSession();
  const colorScheme = useColorScheme() ?? 'light';
  const puedeGestionar = usuario?.rol === 'Administrador';

  const [planes, setPlanes] = useState<PlanMembresia[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('TODOS');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<number | null>(null);

  const [mostrarFormularioNuevo, setMostrarFormularioNuevo] = useState(false);
  const [formularioNuevo, setFormularioNuevo] = useState(FORMULARIO_VACIO);
  const [creando, setCreando] = useState(false);

  const [filaEditando, setFilaEditando] = useState<number | null>(null);
  const [formularioEdicion, setFormularioEdicion] = useState(FORMULARIO_VACIO);

  const cargarPlanes = useCallback(
    async (mostrarCargando: boolean) => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      if (mostrarCargando) setIsLoading(true);
      setError(null);

      try {
        const data = await listPlanesMembresia(token, {
          estado:
            puedeGestionar && filtroEstado !== 'TODOS' ? filtroEstado : undefined,
        });
        setPlanes(data);
      } catch (fetchError) {
        setError(
          fetchError instanceof ApiError
            ? fetchError.message
            : 'No se pudieron consultar los planes de membresía.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, puedeGestionar, filtroEstado],
  );

  useFocusEffect(
    useCallback(() => {
      cargarPlanes(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cargarPlanes]),
  );

  function onRefresh() {
    setIsRefreshing(true);
    cargarPlanes(false);
  }

  async function handleCrearPlan() {
    if (!token) return;

    const duracion = Number(formularioNuevo.duracion_dias);
    const precio = Number(formularioNuevo.precio);

    if (
      !formularioNuevo.nombre.trim() ||
      !Number.isInteger(duracion) ||
      duracion <= 0 ||
      !(precio > 0)
    ) {
      notify(
        'Datos incompletos',
        'Nombre, duración en días (entero positivo) y precio (mayor a cero) son obligatorios.',
      );
      return;
    }

    setCreando(true);

    try {
      await crearPlanMembresia(token, {
        nombre: formularioNuevo.nombre.trim(),
        descripcion: formularioNuevo.descripcion.trim() || null,
        duracion_dias: duracion,
        precio,
      });
      setFormularioNuevo(FORMULARIO_VACIO);
      setMostrarFormularioNuevo(false);
      cargarPlanes(false);
    } catch (createError) {
      notify(
        'No se pudo registrar el plan',
        createError instanceof ApiError
          ? createError.message
          : 'Ocurrió un error inesperado.',
      );
    } finally {
      setCreando(false);
    }
  }

  function iniciarEdicion(plan: PlanMembresia) {
    setFilaEditando(plan.id_plan);
    setFormularioEdicion({
      nombre: plan.nombre,
      descripcion: plan.descripcion ?? '',
      duracion_dias: String(plan.duracion_dias),
      precio: plan.precio,
    });
  }

  async function handleGuardarEdicion(idPlan: number) {
    if (!token) return;

    const duracion = Number(formularioEdicion.duracion_dias);
    const precio = Number(formularioEdicion.precio);

    if (
      !formularioEdicion.nombre.trim() ||
      !Number.isInteger(duracion) ||
      duracion <= 0 ||
      !(precio > 0)
    ) {
      notify(
        'Datos incompletos',
        'Nombre, duración en días (entero positivo) y precio (mayor a cero) son obligatorios.',
      );
      return;
    }

    setProcesando(idPlan);

    try {
      const actualizado = await actualizarPlanMembresia(token, idPlan, {
        nombre: formularioEdicion.nombre.trim(),
        descripcion: formularioEdicion.descripcion.trim() || null,
        duracion_dias: duracion,
        precio,
      });
      setPlanes((prev) =>
        prev.map((p) => (p.id_plan === idPlan ? actualizado : p)),
      );
      setFilaEditando(null);
    } catch (updateError) {
      notify(
        'No se pudo actualizar',
        updateError instanceof ApiError
          ? updateError.message
          : 'Ocurrió un error inesperado.',
      );
    } finally {
      setProcesando(null);
    }
  }

  async function handleDesactivar(plan: PlanMembresia) {
    const confirmado = await confirmAsync(
      'Desactivar plan',
      `¿Seguro que deseas desactivar el plan "${plan.nombre}"?`,
      'Desactivar',
    );

    if (!confirmado || !token) return;

    setProcesando(plan.id_plan);

    try {
      const actualizado = await desactivarPlanMembresia(token, plan.id_plan);
      setPlanes((prev) =>
        prev.map((p) => (p.id_plan === plan.id_plan ? actualizado : p)),
      );
    } catch (deactivateError) {
      notify(
        'No se pudo desactivar',
        deactivateError instanceof ApiError
          ? deactivateError.message
          : 'Ocurrió un error inesperado.',
      );
    } finally {
      setProcesando(null);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.spacing}>
        Planes de membresía
      </ThemedText>

      {puedeGestionar && (
        <View style={styles.filtros}>
          {(['TODOS', 'ACTIVO', 'INACTIVO'] as FiltroEstado[]).map((opcion) => (
            <Pressable
              key={opcion}
              onPress={() => setFiltroEstado(opcion)}
              style={[
                styles.chip,
                {
                  borderColor: Colors[colorScheme].tint,
                  backgroundColor:
                    filtroEstado === opcion ? Colors[colorScheme].tint : 'transparent',
                },
              ]}>
              <ThemedText
                style={{
                  color: filtroEstado === opcion ? '#fff' : Colors[colorScheme].text,
                  fontSize: 13,
                }}>
                {opcion === 'TODOS' ? 'Todos' : opcion === 'ACTIVO' ? 'Activos' : 'Inactivos'}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}

      {puedeGestionar && (
        <Pressable
          onPress={() => setMostrarFormularioNuevo((v) => !v)}
          style={[styles.nuevoBoton, { borderColor: Colors[colorScheme].tint }]}>
          <ThemedText style={{ color: Colors[colorScheme].tint, fontWeight: '600' }}>
            {mostrarFormularioNuevo ? 'Cancelar' : '+ Nuevo plan'}
          </ThemedText>
        </Pressable>
      )}

      {mostrarFormularioNuevo && (
        <View style={[styles.formulario, { borderColor: Colors[colorScheme].icon }]}>
          <TextInput
            value={formularioNuevo.nombre}
            onChangeText={(texto) =>
              setFormularioNuevo((prev) => ({ ...prev, nombre: texto }))
            }
            placeholder="Nombre *"
            placeholderTextColor={Colors[colorScheme].icon}
            style={[styles.input, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon }]}
          />
          <TextInput
            value={formularioNuevo.descripcion}
            onChangeText={(texto) =>
              setFormularioNuevo((prev) => ({ ...prev, descripcion: texto }))
            }
            placeholder="Descripción"
            placeholderTextColor={Colors[colorScheme].icon}
            style={[styles.input, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon }]}
          />
          <TextInput
            value={formularioNuevo.duracion_dias}
            onChangeText={(texto) =>
              setFormularioNuevo((prev) => ({ ...prev, duracion_dias: texto }))
            }
            placeholder="Duración en días *"
            keyboardType="numeric"
            placeholderTextColor={Colors[colorScheme].icon}
            style={[styles.input, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon }]}
          />
          <TextInput
            value={formularioNuevo.precio}
            onChangeText={(texto) =>
              setFormularioNuevo((prev) => ({ ...prev, precio: texto }))
            }
            placeholder="Precio *"
            keyboardType="numeric"
            placeholderTextColor={Colors[colorScheme].icon}
            style={[styles.input, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon }]}
          />

          <Pressable
            disabled={creando}
            onPress={handleCrearPlan}
            style={[styles.guardarBoton, { backgroundColor: Colors[colorScheme].tint }]}>
            {creando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={{ color: '#fff', fontWeight: '600' }}>
                Guardar plan
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
          data={planes}
          keyExtractor={(item) => String(item.id_plan)}
          extraData={[filaEditando, formularioEdicion, procesando]}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <ThemedText style={styles.spacing}>No se encontraron planes.</ThemedText>
          }
          renderItem={({ item }) => {
            const bloqueado = procesando === item.id_plan;
            const editando = filaEditando === item.id_plan;

            return (
              <View style={[styles.row, { borderColor: Colors[colorScheme].icon }]}>
                {editando ? (
                  <>
                    <TextInput
                      value={formularioEdicion.nombre}
                      onChangeText={(texto) =>
                        setFormularioEdicion((prev) => ({ ...prev, nombre: texto }))
                      }
                      placeholder="Nombre"
                      placeholderTextColor={Colors[colorScheme].icon}
                      style={[styles.input, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon }]}
                    />
                    <TextInput
                      value={formularioEdicion.descripcion}
                      onChangeText={(texto) =>
                        setFormularioEdicion((prev) => ({ ...prev, descripcion: texto }))
                      }
                      placeholder="Descripción"
                      placeholderTextColor={Colors[colorScheme].icon}
                      style={[styles.input, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon }]}
                    />
                    <TextInput
                      value={formularioEdicion.duracion_dias}
                      onChangeText={(texto) =>
                        setFormularioEdicion((prev) => ({ ...prev, duracion_dias: texto }))
                      }
                      placeholder="Duración en días"
                      keyboardType="numeric"
                      placeholderTextColor={Colors[colorScheme].icon}
                      style={[styles.input, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon }]}
                    />
                    <TextInput
                      value={formularioEdicion.precio}
                      onChangeText={(texto) =>
                        setFormularioEdicion((prev) => ({ ...prev, precio: texto }))
                      }
                      placeholder="Precio"
                      keyboardType="numeric"
                      placeholderTextColor={Colors[colorScheme].icon}
                      style={[styles.input, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon }]}
                    />
                    <View style={styles.actions}>
                      <Pressable
                        disabled={bloqueado}
                        onPress={() => handleGuardarEdicion(item.id_plan)}
                        style={styles.actionButton}>
                        {bloqueado ? (
                          <ActivityIndicator size="small" />
                        ) : (
                          <ThemedText style={styles.actionText}>Guardar</ThemedText>
                        )}
                      </Pressable>
                      <Pressable
                        disabled={bloqueado}
                        onPress={() => setFilaEditando(null)}
                        style={styles.actionButton}>
                        <ThemedText style={styles.actionText}>Cancelar</ThemedText>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <>
                    <ThemedText type="defaultSemiBold">{item.nombre}</ThemedText>
                    {item.descripcion ? <ThemedText>{item.descripcion}</ThemedText> : null}
                    <ThemedText>Duración: {item.duracion_dias} días</ThemedText>
                    <ThemedText>Precio: Bs. {item.precio}</ThemedText>
                    <ThemedText>Estado: {item.estado}</ThemedText>

                    {puedeGestionar && (
                      <View style={styles.actions}>
                        <Pressable
                          disabled={bloqueado}
                          onPress={() => iniciarEdicion(item)}
                          style={styles.actionButton}>
                          <ThemedText style={styles.actionText}>Editar</ThemedText>
                        </Pressable>

                        {item.estado === 'ACTIVO' && (
                          <Pressable
                            disabled={bloqueado}
                            onPress={() => handleDesactivar(item)}
                            style={styles.actionButton}>
                            {bloqueado ? (
                              <ActivityIndicator size="small" />
                            ) : (
                              <ThemedText style={[styles.actionText, styles.error]}>
                                Desactivar
                              </ThemedText>
                            )}
                          </Pressable>
                        )}
                      </View>
                    )}
                  </>
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
  guardarBoton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
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
