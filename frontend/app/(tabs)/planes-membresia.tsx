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

import { Badge } from '@/components/ui/badge';
import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/themed-text';
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
import { Colors, Radius, Spacing, cardShadow } from '@/constants/theme';
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
  const colors = Colors[colorScheme];
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
    <Screen>
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
                  borderColor: filtroEstado === opcion ? colors.tint : colors.border,
                  backgroundColor: filtroEstado === opcion ? colors.tint : colors.surface,
                },
              ]}>
              <ThemedText
                style={{
                  color: filtroEstado === opcion ? colors.tintOn : colors.text,
                  fontSize: 13,
                  fontWeight: '600',
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
          style={[styles.nuevoBoton, { borderColor: colors.tint }]}>
          <ThemedText style={{ color: colors.tint, fontWeight: '700' }}>
            {mostrarFormularioNuevo ? 'Cancelar' : '+ Nuevo plan'}
          </ThemedText>
        </Pressable>
      )}

      {mostrarFormularioNuevo && (
        <View
          style={[
            styles.formulario,
            { backgroundColor: colors.surface },
            cardShadow(colorScheme),
          ]}>
          <TextInput
            value={formularioNuevo.nombre}
            onChangeText={(texto) =>
              setFormularioNuevo((prev) => ({ ...prev, nombre: texto }))
            }
            placeholder="Nombre *"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
          />
          <TextInput
            value={formularioNuevo.descripcion}
            onChangeText={(texto) =>
              setFormularioNuevo((prev) => ({ ...prev, descripcion: texto }))
            }
            placeholder="Descripción"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
          />
          <TextInput
            value={formularioNuevo.duracion_dias}
            onChangeText={(texto) =>
              setFormularioNuevo((prev) => ({ ...prev, duracion_dias: texto }))
            }
            placeholder="Duración en días *"
            keyboardType="numeric"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
          />
          <TextInput
            value={formularioNuevo.precio}
            onChangeText={(texto) =>
              setFormularioNuevo((prev) => ({ ...prev, precio: texto }))
            }
            placeholder="Precio *"
            keyboardType="numeric"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
          />

          <Pressable
            disabled={creando}
            onPress={handleCrearPlan}
            style={[styles.guardarBoton, { backgroundColor: colors.tint }]}>
            {creando ? (
              <ActivityIndicator color={colors.tintOn} />
            ) : (
              <ThemedText style={{ color: colors.tintOn, fontWeight: '700' }}>
                Guardar plan
              </ThemedText>
            )}
          </Pressable>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator style={styles.spacing} />
      ) : error ? (
        <View style={[styles.messageBox, { backgroundColor: colors.dangerMuted }]}>
          <ThemedText style={{ color: colors.danger }}>{error}</ThemedText>
        </View>
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
              <View
                style={[
                  styles.row,
                  { backgroundColor: colors.surface },
                  cardShadow(colorScheme),
                ]}>
                {editando ? (
                  <>
                    <TextInput
                      value={formularioEdicion.nombre}
                      onChangeText={(texto) =>
                        setFormularioEdicion((prev) => ({ ...prev, nombre: texto }))
                      }
                      placeholder="Nombre"
                      placeholderTextColor={colors.textMuted}
                      style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                    />
                    <TextInput
                      value={formularioEdicion.descripcion}
                      onChangeText={(texto) =>
                        setFormularioEdicion((prev) => ({ ...prev, descripcion: texto }))
                      }
                      placeholder="Descripción"
                      placeholderTextColor={colors.textMuted}
                      style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                    />
                    <TextInput
                      value={formularioEdicion.duracion_dias}
                      onChangeText={(texto) =>
                        setFormularioEdicion((prev) => ({ ...prev, duracion_dias: texto }))
                      }
                      placeholder="Duración en días"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textMuted}
                      style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                    />
                    <TextInput
                      value={formularioEdicion.precio}
                      onChangeText={(texto) =>
                        setFormularioEdicion((prev) => ({ ...prev, precio: texto }))
                      }
                      placeholder="Precio"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textMuted}
                      style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                    />
                    <View style={styles.actions}>
                      <Pressable
                        disabled={bloqueado}
                        onPress={() => handleGuardarEdicion(item.id_plan)}
                        style={styles.actionButton}>
                        {bloqueado ? (
                          <ActivityIndicator size="small" />
                        ) : (
                          <ThemedText style={[styles.actionText, { color: colors.tint }]}>
                            Guardar
                          </ThemedText>
                        )}
                      </Pressable>
                      <Pressable
                        disabled={bloqueado}
                        onPress={() => setFilaEditando(null)}
                        style={styles.actionButton}>
                        <ThemedText style={[styles.actionText, { color: colors.textMuted }]}>
                          Cancelar
                        </ThemedText>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.rowHeader}>
                      <ThemedText type="defaultSemiBold">{item.nombre}</ThemedText>
                      <Badge estado={item.estado} />
                    </View>
                    {item.descripcion ? (
                      <ThemedText style={{ color: colors.textMuted }}>
                        {item.descripcion}
                      </ThemedText>
                    ) : null}
                    <ThemedText style={{ color: colors.textMuted }}>
                      Duración: {item.duracion_dias} días
                    </ThemedText>
                    <ThemedText style={[styles.precio, { color: colors.tint }]}>
                      Bs. {item.precio}
                    </ThemedText>

                    {puedeGestionar && (
                      <View style={styles.actions}>
                        <Pressable
                          disabled={bloqueado}
                          onPress={() => iniciarEdicion(item)}
                          style={styles.actionButton}>
                          <ThemedText style={[styles.actionText, { color: colors.tint }]}>
                            Editar
                          </ThemedText>
                        </Pressable>

                        {item.estado === 'ACTIVO' && (
                          <Pressable
                            disabled={bloqueado}
                            onPress={() => handleDesactivar(item)}
                            style={styles.actionButton}>
                            {bloqueado ? (
                              <ActivityIndicator size="small" />
                            ) : (
                              <ThemedText style={[styles.actionText, { color: colors.danger }]}>
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
  filtros: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  nuevoBoton: {
    borderWidth: 1.5,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  formulario: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  guardarBoton: {
    borderRadius: Radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  row: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 4,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  precio: {
    fontWeight: '700',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingVertical: 4,
  },
  actionText: {
    fontWeight: '700',
  },
});
