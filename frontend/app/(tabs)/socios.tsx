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
  actualizarSocio,
  ApiError,
  crearSocio,
  desactivarSocio,
  listSocios,
  type SocioListado,
} from '@/lib/api';
import { confirmAsync, notify } from '@/lib/confirm';
import { Colors } from '@/constants/theme';
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
      <ThemedView style={styles.container}>
        <ThemedText type="title">Socios</ThemedText>
        <ThemedText style={styles.spacing}>
          No tienes permisos para ver esta sección.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.spacing}>
        Socios
      </ThemedText>

      <TextInput
        value={busqueda}
        onChangeText={setBusqueda}
        onSubmitEditing={() => cargarSocios(true)}
        placeholder="Buscar por nombre, CI o código"
        placeholderTextColor={Colors[colorScheme].icon}
        style={[
          styles.search,
          { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon },
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

      <Pressable
        onPress={() => setMostrarFormularioNuevo((v) => !v)}
        style={[styles.nuevoBoton, { borderColor: Colors[colorScheme].tint }]}>
        <ThemedText style={{ color: Colors[colorScheme].tint, fontWeight: '600' }}>
          {mostrarFormularioNuevo ? 'Cancelar' : '+ Nuevo socio'}
        </ThemedText>
      </Pressable>

      {mostrarFormularioNuevo && (
        <View style={[styles.formulario, { borderColor: Colors[colorScheme].icon }]}>
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
              placeholderTextColor={Colors[colorScheme].icon}
              style={[
                styles.input,
                { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon },
              ]}
            />
          ))}

          <Pressable
            disabled={creando}
            onPress={handleCrearSocio}
            style={[styles.guardarBoton, { backgroundColor: Colors[colorScheme].tint }]}>
            {creando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={{ color: '#fff', fontWeight: '600' }}>
                Guardar socio
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
              <View style={[styles.row, { borderColor: Colors[colorScheme].icon }]}>
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
                        placeholderTextColor={Colors[colorScheme].icon}
                        style={[
                          styles.input,
                          {
                            color: Colors[colorScheme].text,
                            borderColor: Colors[colorScheme].icon,
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
                    <ThemedText type="defaultSemiBold">
                      {item.nombres} {item.apellidos}
                    </ThemedText>
                    <ThemedText>Código: {item.codigo_socio}</ThemedText>
                    {item.correo ? <ThemedText>{item.correo}</ThemedText> : null}
                    <ThemedText>Estado: {item.estado}</ThemedText>

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
  search: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
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
  },
  actionButton: {
    paddingVertical: 4,
  },
  actionText: {
    fontWeight: '600',
  },
});
