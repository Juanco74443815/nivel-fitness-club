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
  actualizarSocio,
  ApiError,
  crearSocio,
  desactivarSocio,
  listSocios,
  type SocioListado,
} from '@/lib/api';
import { confirmAsync, notify } from '@/lib/confirm';
import { Colors, Radius, Spacing, cardShadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type FiltroEstado = 'TODOS' | 'ACTIVO' | 'INACTIVO';

interface FormularioSocio {
  nombres: string;
  apellidos: string;
  ci: string;
  telefono: string;
  correo: string;
  fecha_nacimiento: string;
}

const FORMULARIO_VACIO: FormularioSocio = {
  nombres: '',
  apellidos: '',
  ci: '',
  telefono: '',
  correo: '',
  fecha_nacimiento: '',
};

export default function SociosScreen() {
  const { token, usuario } = useSession();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const puedeGestionar =
    usuario?.rol === 'Administrador' || usuario?.rol === 'Recepcionista';

  const [socios, setSocios] = useState<SocioListado[]>([]);
  const [busqueda, setBusqueda] = useState('');
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

  const cargarSocios = useCallback(
    async (mostrarCargando: boolean) => {
      if (!token || !puedeGestionar) {
        setIsLoading(false);
        return;
      }

      if (mostrarCargando) setIsLoading(true);
      setError(null);

      try {
        const data = await listSocios(token, {
          estado: filtroEstado === 'TODOS' ? undefined : filtroEstado,
          q: busqueda.trim() || undefined,
        });
        setSocios(data);
      } catch (fetchError) {
        setError(
          fetchError instanceof ApiError
            ? fetchError.message
            : 'No se pudieron consultar los socios.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, puedeGestionar, filtroEstado, busqueda],
  );

  useFocusEffect(
    useCallback(() => {
      cargarSocios(true);
      // Se ejecuta al enfocar la pantalla y cada vez que cambian los filtros.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cargarSocios]),
  );

  function onRefresh() {
    setIsRefreshing(true);
    cargarSocios(false);
  }

  async function handleCrearSocio() {
    if (!token) return;

    if (!formularioNuevo.nombres.trim() || !formularioNuevo.apellidos.trim()) {
      notify('Datos incompletos', 'Nombres y apellidos son obligatorios.');
      return;
    }

    setCreando(true);

    try {
      await crearSocio(token, {
        nombres: formularioNuevo.nombres.trim(),
        apellidos: formularioNuevo.apellidos.trim(),
        ci: formularioNuevo.ci.trim() || null,
        telefono: formularioNuevo.telefono.trim() || null,
        correo: formularioNuevo.correo.trim() || null,
        fecha_nacimiento: formularioNuevo.fecha_nacimiento.trim() || null,
      });
      setFormularioNuevo(FORMULARIO_VACIO);
      setMostrarFormularioNuevo(false);
      cargarSocios(false);
    } catch (createError) {
      notify(
        'No se pudo registrar el socio',
        createError instanceof ApiError
          ? createError.message
          : 'Ocurrió un error inesperado.',
      );
    } finally {
      setCreando(false);
    }
  }

  function iniciarEdicion(socio: SocioListado) {
    setFilaEditando(socio.id_socio);
    setFormularioEdicion({
      nombres: socio.nombres,
      apellidos: socio.apellidos,
      ci: socio.ci ?? '',
      telefono: socio.telefono ?? '',
      correo: socio.correo ?? '',
      fecha_nacimiento: socio.fecha_nacimiento ?? '',
    });
  }

  async function handleGuardarEdicion(idSocio: number) {
    if (!token) return;

    setProcesando(idSocio);

    try {
      const actualizado = await actualizarSocio(token, idSocio, {
        nombres: formularioEdicion.nombres.trim(),
        apellidos: formularioEdicion.apellidos.trim(),
        ci: formularioEdicion.ci.trim() || null,
        telefono: formularioEdicion.telefono.trim() || null,
        correo: formularioEdicion.correo.trim() || null,
        fecha_nacimiento: formularioEdicion.fecha_nacimiento.trim() || null,
      });
      setSocios((prev) =>
        prev.map((s) => (s.id_socio === idSocio ? actualizado : s)),
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

  async function handleDesactivar(socio: SocioListado) {
    const confirmado = await confirmAsync(
      'Desactivar socio',
      `¿Seguro que deseas desactivar a ${socio.nombres} ${socio.apellidos} (${socio.codigo_socio})?`,
      'Desactivar',
    );

    if (!confirmado || !token) return;

    setProcesando(socio.id_socio);

    try {
      const actualizado = await desactivarSocio(token, socio.id_socio);
      setSocios((prev) =>
        prev.map((s) => (s.id_socio === socio.id_socio ? actualizado : s)),
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

  if (!puedeGestionar) {
    return (
      <Screen>
        <ThemedText type="title">Socios</ThemedText>
        <ThemedText style={styles.spacing}>
          No tienes permisos para ver esta sección.
        </ThemedText>
      </Screen>
    );
  }

  return (
    <Screen>
      <ThemedText type="title" style={styles.spacing}>
        Socios
      </ThemedText>

      <TextInput
        value={busqueda}
        onChangeText={setBusqueda}
        onSubmitEditing={() => cargarSocios(true)}
        placeholder="Buscar por nombre, CI o código"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.search,
          { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      />

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

      <Pressable
        onPress={() => setMostrarFormularioNuevo((v) => !v)}
        style={[styles.nuevoBoton, { borderColor: colors.tint }]}>
        <ThemedText style={{ color: colors.tint, fontWeight: '700' }}>
          {mostrarFormularioNuevo ? 'Cancelar' : '+ Nuevo socio'}
        </ThemedText>
      </Pressable>

      {mostrarFormularioNuevo && (
        <View
          style={[
            styles.formulario,
            { backgroundColor: colors.surface },
            cardShadow(colorScheme),
          ]}>
          {(
            [
              ['nombres', 'Nombres *'],
              ['apellidos', 'Apellidos *'],
              ['ci', 'CI'],
              ['telefono', 'Teléfono'],
              ['correo', 'Correo'],
              ['fecha_nacimiento', 'Fecha de nacimiento (AAAA-MM-DD)'],
            ] as [keyof FormularioSocio, string][]
          ).map(([campo, etiqueta]) => (
            <TextInput
              key={campo}
              value={formularioNuevo[campo]}
              onChangeText={(texto) =>
                setFormularioNuevo((prev) => ({ ...prev, [campo]: texto }))
              }
              placeholder={etiqueta}
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
              ]}
            />
          ))}

          <Pressable
            disabled={creando}
            onPress={handleCrearSocio}
            style={[styles.guardarBoton, { backgroundColor: colors.tint }]}>
            {creando ? (
              <ActivityIndicator color={colors.tintOn} />
            ) : (
              <ThemedText style={{ color: colors.tintOn, fontWeight: '700' }}>
                Guardar socio
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
          data={socios}
          keyExtractor={(item) => String(item.id_socio)}
          extraData={[filaEditando, formularioEdicion, procesando]}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <ThemedText style={styles.spacing}>No se encontraron socios.</ThemedText>
          }
          renderItem={({ item }) => {
            const bloqueado = procesando === item.id_socio;
            const editando = filaEditando === item.id_socio;

            return (
              <View
                style={[
                  styles.row,
                  { backgroundColor: colors.surface },
                  cardShadow(colorScheme),
                ]}>
                {editando ? (
                  <>
                    {(
                      [
                        ['nombres', 'Nombres'],
                        ['apellidos', 'Apellidos'],
                        ['ci', 'CI'],
                        ['telefono', 'Teléfono'],
                        ['correo', 'Correo'],
                        ['fecha_nacimiento', 'Fecha de nacimiento (AAAA-MM-DD)'],
                      ] as [keyof FormularioSocio, string][]
                    ).map(([campo, etiqueta]) => (
                      <TextInput
                        key={campo}
                        value={formularioEdicion[campo]}
                        onChangeText={(texto) =>
                          setFormularioEdicion((prev) => ({ ...prev, [campo]: texto }))
                        }
                        placeholder={etiqueta}
                        placeholderTextColor={colors.textMuted}
                        style={[
                          styles.input,
                          {
                            color: colors.text,
                            borderColor: colors.border,
                            backgroundColor: colors.background,
                          },
                        ]}
                      />
                    ))}
                    <View style={styles.actions}>
                      <Pressable
                        disabled={bloqueado}
                        onPress={() => handleGuardarEdicion(item.id_socio)}
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
                      <ThemedText type="defaultSemiBold">
                        {item.nombres} {item.apellidos}
                      </ThemedText>
                      <Badge estado={item.estado} />
                    </View>
                    <ThemedText style={{ color: colors.textMuted }}>
                      Código: {item.codigo_socio}
                    </ThemedText>
                    {item.correo ? (
                      <ThemedText style={{ color: colors.textMuted }}>{item.correo}</ThemedText>
                    ) : null}

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
  search: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  filtros: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
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
  actions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  actionButton: {
    paddingVertical: 4,
  },
  actionText: {
    fontWeight: '700',
  },
});
