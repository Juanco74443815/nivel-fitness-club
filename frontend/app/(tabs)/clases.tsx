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
  actualizarClase,
  actualizarProgramacion,
  ApiError,
  cancelarProgramacion,
  type Clase,
  crearClase,
  crearProgramacion,
  desactivarClase,
  listClases,
  listProgramaciones,
  type ProgramacionClase,
} from '@/lib/api';
import { confirmAsync, notify } from '@/lib/confirm';
import { formatFecha, formatHora } from '@/lib/format';
import { Colors, Radius, Spacing, cardShadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type FiltroEstado = 'TODOS' | 'ACTIVO' | 'INACTIVO';

interface FormularioClase {
  nombre: string;
  descripcion: string;
  instructor: string;
}

const FORMULARIO_CLASE_VACIO: FormularioClase = {
  nombre: '',
  descripcion: '',
  instructor: '',
};

interface FormularioProgramacion {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  cupo_maximo: string;
}

const FORMULARIO_PROGRAMACION_VACIO: FormularioProgramacion = {
  fecha: '',
  hora_inicio: '',
  hora_fin: '',
  cupo_maximo: '',
};

export default function ClasesScreen() {
  const { token, usuario } = useSession();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const esAdministrador = usuario?.rol === 'Administrador';

  const [clases, setClases] = useState<Clase[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('TODOS');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<number | null>(null);

  const [mostrarFormularioNuevo, setMostrarFormularioNuevo] = useState(false);
  const [formularioNuevo, setFormularioNuevo] = useState(FORMULARIO_CLASE_VACIO);
  const [creando, setCreando] = useState(false);

  const [filaEditando, setFilaEditando] = useState<number | null>(null);
  const [formularioEdicion, setFormularioEdicion] = useState(FORMULARIO_CLASE_VACIO);

  const [claseExpandida, setClaseExpandida] = useState<number | null>(null);
  const [programaciones, setProgramaciones] = useState<ProgramacionClase[]>([]);
  const [cargandoProgramaciones, setCargandoProgramaciones] = useState(false);
  const [formularioSesion, setFormularioSesion] = useState(
    FORMULARIO_PROGRAMACION_VACIO,
  );
  const [creandoSesion, setCreandoSesion] = useState(false);
  const [procesandoSesion, setProcesandoSesion] = useState<number | null>(null);
  const [sesionEditando, setSesionEditando] = useState<number | null>(null);
  const [formularioEdicionSesion, setFormularioEdicionSesion] = useState(
    FORMULARIO_PROGRAMACION_VACIO,
  );

  const cargarClases = useCallback(
    async (mostrarCargando: boolean) => {
      if (!token || !esAdministrador) {
        setIsLoading(false);
        return;
      }

      if (mostrarCargando) setIsLoading(true);
      setError(null);

      try {
        const data = await listClases(token, {
          estado: filtroEstado === 'TODOS' ? undefined : filtroEstado,
        });
        setClases(data);
      } catch (fetchError) {
        setError(
          fetchError instanceof ApiError
            ? fetchError.message
            : 'No se pudieron consultar las clases.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, esAdministrador, filtroEstado],
  );

  useFocusEffect(
    useCallback(() => {
      cargarClases(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cargarClases]),
  );

  function onRefresh() {
    setIsRefreshing(true);
    cargarClases(false);
  }

  async function handleCrearClase() {
    if (!token) return;

    if (!formularioNuevo.nombre.trim()) {
      notify('Datos incompletos', 'El nombre de la clase es obligatorio.');
      return;
    }

    setCreando(true);

    try {
      await crearClase(token, {
        nombre: formularioNuevo.nombre.trim(),
        descripcion: formularioNuevo.descripcion.trim() || null,
        instructor: formularioNuevo.instructor.trim() || null,
      });
      setFormularioNuevo(FORMULARIO_CLASE_VACIO);
      setMostrarFormularioNuevo(false);
      cargarClases(false);
    } catch (createError) {
      notify(
        'No se pudo registrar la clase',
        createError instanceof ApiError
          ? createError.message
          : 'Ocurrió un error inesperado.',
      );
    } finally {
      setCreando(false);
    }
  }

  function iniciarEdicion(clase: Clase) {
    setFilaEditando(clase.id_clase);
    setFormularioEdicion({
      nombre: clase.nombre,
      descripcion: clase.descripcion ?? '',
      instructor: clase.instructor ?? '',
    });
  }

  async function handleGuardarEdicion(idClase: number) {
    if (!token) return;

    setProcesando(idClase);

    try {
      const actualizada = await actualizarClase(token, idClase, {
        nombre: formularioEdicion.nombre.trim(),
        descripcion: formularioEdicion.descripcion.trim() || null,
        instructor: formularioEdicion.instructor.trim() || null,
      });
      setClases((prev) =>
        prev.map((c) => (c.id_clase === idClase ? actualizada : c)),
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

  async function handleDesactivar(clase: Clase) {
    const confirmado = await confirmAsync(
      'Desactivar clase',
      `¿Seguro que deseas desactivar la clase "${clase.nombre}"?`,
      'Desactivar',
    );

    if (!confirmado || !token) return;

    setProcesando(clase.id_clase);

    try {
      const actualizada = await desactivarClase(token, clase.id_clase);
      setClases((prev) =>
        prev.map((c) => (c.id_clase === clase.id_clase ? actualizada : c)),
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

  async function cargarProgramaciones(idClase: number) {
    if (!token) return;

    setCargandoProgramaciones(true);

    try {
      const data = await listProgramaciones(token, { id_clase: idClase });
      setProgramaciones(data);
    } catch (fetchError) {
      notify(
        'No se pudieron consultar las sesiones',
        fetchError instanceof ApiError
          ? fetchError.message
          : 'Ocurrió un error inesperado.',
      );
    } finally {
      setCargandoProgramaciones(false);
    }
  }

  async function handleToggleExpandir(clase: Clase) {
    if (claseExpandida === clase.id_clase) {
      setClaseExpandida(null);
      setProgramaciones([]);
      return;
    }

    setClaseExpandida(clase.id_clase);
    setFormularioSesion(FORMULARIO_PROGRAMACION_VACIO);
    setSesionEditando(null);
    await cargarProgramaciones(clase.id_clase);
  }

  function iniciarEdicionSesion(sesion: ProgramacionClase) {
    setSesionEditando(sesion.id_programacion);
    setFormularioEdicionSesion({
      fecha: sesion.fecha.slice(0, 10),
      hora_inicio: sesion.hora_inicio.slice(0, 5),
      hora_fin: sesion.hora_fin.slice(0, 5),
      cupo_maximo: String(sesion.cupo_maximo),
    });
  }

  async function handleGuardarEdicionSesion(idClase: number, idProgramacion: number) {
    if (!token) return;

    const cupo = Number(formularioEdicionSesion.cupo_maximo);

    if (
      !formularioEdicionSesion.fecha.trim() ||
      !formularioEdicionSesion.hora_inicio.trim() ||
      !formularioEdicionSesion.hora_fin.trim() ||
      !Number.isInteger(cupo) ||
      cupo <= 0
    ) {
      notify(
        'Datos incompletos',
        'Fecha, hora de inicio, hora de fin y cupo máximo (entero mayor a cero) son obligatorios.',
      );
      return;
    }

    setProcesandoSesion(idProgramacion);

    try {
      await actualizarProgramacion(token, idProgramacion, {
        fecha: formularioEdicionSesion.fecha.trim(),
        hora_inicio: formularioEdicionSesion.hora_inicio.trim(),
        hora_fin: formularioEdicionSesion.hora_fin.trim(),
        cupo_maximo: cupo,
      });
      setSesionEditando(null);
      await cargarProgramaciones(idClase);
    } catch (updateError) {
      notify(
        'No se pudo actualizar la sesión',
        updateError instanceof ApiError
          ? updateError.message
          : 'Ocurrió un error inesperado.',
      );
    } finally {
      setProcesandoSesion(null);
    }
  }

  async function handleCrearSesion(idClase: number) {
    if (!token) return;

    const cupo = Number(formularioSesion.cupo_maximo);

    if (
      !formularioSesion.fecha.trim() ||
      !formularioSesion.hora_inicio.trim() ||
      !formularioSesion.hora_fin.trim() ||
      !Number.isInteger(cupo) ||
      cupo <= 0
    ) {
      notify(
        'Datos incompletos',
        'Fecha, hora de inicio, hora de fin y cupo máximo (entero mayor a cero) son obligatorios.',
      );
      return;
    }

    setCreandoSesion(true);

    try {
      await crearProgramacion(token, {
        id_clase: idClase,
        fecha: formularioSesion.fecha.trim(),
        hora_inicio: formularioSesion.hora_inicio.trim(),
        hora_fin: formularioSesion.hora_fin.trim(),
        cupo_maximo: cupo,
      });
      setFormularioSesion(FORMULARIO_PROGRAMACION_VACIO);
      await cargarProgramaciones(idClase);
    } catch (createError) {
      notify(
        'No se pudo registrar la sesión',
        createError instanceof ApiError
          ? createError.message
          : 'Ocurrió un error inesperado.',
      );
    } finally {
      setCreandoSesion(false);
    }
  }

  async function handleCancelarSesion(
    idClase: number,
    programacion: ProgramacionClase,
  ) {
    const confirmado = await confirmAsync(
      'Cancelar sesión',
      `¿Seguro que deseas cancelar la sesión del ${programacion.fecha} (${programacion.hora_inicio} - ${programacion.hora_fin})?`,
      'Cancelar sesión',
    );

    if (!confirmado || !token) return;

    setProcesandoSesion(programacion.id_programacion);

    try {
      await cancelarProgramacion(token, programacion.id_programacion);
      await cargarProgramaciones(idClase);
    } catch (cancelError) {
      notify(
        'No se pudo cancelar la sesión',
        cancelError instanceof ApiError
          ? cancelError.message
          : 'Ocurrió un error inesperado.',
      );
    } finally {
      setProcesandoSesion(null);
    }
  }

  if (!esAdministrador) {
    return (
      <Screen>
        <ThemedText type="title">Clases</ThemedText>
        <ThemedText style={styles.spacing}>
          No tienes permisos para ver esta sección.
        </ThemedText>
      </Screen>
    );
  }

  return (
    <Screen wide>
      <ThemedText type="title" style={styles.spacing}>
        Clases
      </ThemedText>

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
              {opcion === 'TODOS' ? 'Todas' : opcion === 'ACTIVO' ? 'Activas' : 'Inactivas'}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => setMostrarFormularioNuevo((v) => !v)}
        style={[styles.nuevoBoton, { borderColor: colors.tint }]}>
        <ThemedText style={{ color: colors.tint, fontWeight: '700' }}>
          {mostrarFormularioNuevo ? 'Cancelar' : '+ Nueva clase'}
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
              ['nombre', 'Nombre *'],
              ['descripcion', 'Descripción'],
              ['instructor', 'Instructor'],
            ] as [keyof FormularioClase, string][]
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
            onPress={handleCrearClase}
            style={[styles.guardarBoton, { backgroundColor: colors.tint }]}>
            {creando ? (
              <ActivityIndicator color={colors.tintOn} />
            ) : (
              <ThemedText style={{ color: colors.tintOn, fontWeight: '700' }}>
                Guardar clase
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
          data={clases}
          keyExtractor={(item) => String(item.id_clase)}
          extraData={[
            filaEditando,
            formularioEdicion,
            procesando,
            claseExpandida,
            programaciones,
            cargandoProgramaciones,
            formularioSesion,
            creandoSesion,
            procesandoSesion,
            sesionEditando,
            formularioEdicionSesion,
          ]}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <ThemedText style={styles.spacing}>No se encontraron clases.</ThemedText>
          }
          renderItem={({ item }) => {
            const bloqueado = procesando === item.id_clase;
            const editando = filaEditando === item.id_clase;
            const expandida = claseExpandida === item.id_clase;

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
                        ['nombre', 'Nombre'],
                        ['descripcion', 'Descripción'],
                        ['instructor', 'Instructor'],
                      ] as [keyof FormularioClase, string][]
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
                        onPress={() => handleGuardarEdicion(item.id_clase)}
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
                    {item.instructor ? (
                      <ThemedText style={{ color: colors.textMuted }}>
                        Instructor: {item.instructor}
                      </ThemedText>
                    ) : null}
                    {item.descripcion ? (
                      <ThemedText style={{ color: colors.textMuted }}>
                        {item.descripcion}
                      </ThemedText>
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

                      <Pressable
                        onPress={() => handleToggleExpandir(item)}
                        style={styles.actionButton}>
                        <ThemedText style={[styles.actionText, { color: colors.accent }]}>
                          {expandida ? 'Ocultar sesiones' : 'Ver sesiones'}
                        </ThemedText>
                      </Pressable>
                    </View>
                  </>
                )}

                {expandida && (
                  <View style={[styles.subseccion, { borderColor: colors.border }]}>
                    <ThemedText type="defaultSemiBold" style={styles.spacingSmall}>
                      Sesiones programadas
                    </ThemedText>

                    <View
                      style={[
                        styles.formulario,
                        { backgroundColor: colors.background, marginBottom: 0 },
                      ]}>
                      <TextInput
                        value={formularioSesion.fecha}
                        onChangeText={(texto) =>
                          setFormularioSesion((prev) => ({ ...prev, fecha: texto }))
                        }
                        placeholder="Fecha (AAAA-MM-DD)"
                        placeholderTextColor={colors.textMuted}
                        style={[
                          styles.input,
                          { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                        ]}
                      />
                      <TextInput
                        value={formularioSesion.hora_inicio}
                        onChangeText={(texto) =>
                          setFormularioSesion((prev) => ({ ...prev, hora_inicio: texto }))
                        }
                        placeholder="Hora de inicio (HH:MM)"
                        placeholderTextColor={colors.textMuted}
                        style={[
                          styles.input,
                          { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                        ]}
                      />
                      <TextInput
                        value={formularioSesion.hora_fin}
                        onChangeText={(texto) =>
                          setFormularioSesion((prev) => ({ ...prev, hora_fin: texto }))
                        }
                        placeholder="Hora de fin (HH:MM)"
                        placeholderTextColor={colors.textMuted}
                        style={[
                          styles.input,
                          { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                        ]}
                      />
                      <TextInput
                        value={formularioSesion.cupo_maximo}
                        onChangeText={(texto) =>
                          setFormularioSesion((prev) => ({ ...prev, cupo_maximo: texto }))
                        }
                        placeholder="Cupo máximo"
                        keyboardType="numeric"
                        placeholderTextColor={colors.textMuted}
                        style={[
                          styles.input,
                          { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                        ]}
                      />

                      <Pressable
                        disabled={creandoSesion}
                        onPress={() => handleCrearSesion(item.id_clase)}
                        style={[styles.guardarBoton, { backgroundColor: colors.tint }]}>
                        {creandoSesion ? (
                          <ActivityIndicator color={colors.tintOn} />
                        ) : (
                          <ThemedText style={{ color: colors.tintOn, fontWeight: '700' }}>
                            Programar sesión
                          </ThemedText>
                        )}
                      </Pressable>
                    </View>

                    {cargandoProgramaciones ? (
                      <ActivityIndicator />
                    ) : programaciones.length === 0 ? (
                      <ThemedText style={{ color: colors.textMuted }}>
                        No hay sesiones programadas para esta clase.
                      </ThemedText>
                    ) : (
                      programaciones.map((sesion) => {
                        const sesionBloqueada =
                          procesandoSesion === sesion.id_programacion;
                        const editandoSesion =
                          sesionEditando === sesion.id_programacion;

                        return (
                          <View
                            key={sesion.id_programacion}
                            style={[styles.sesionRow, { backgroundColor: colors.background }]}>
                            {editandoSesion ? (
                              <>
                                <TextInput
                                  value={formularioEdicionSesion.fecha}
                                  onChangeText={(texto) =>
                                    setFormularioEdicionSesion((prev) => ({
                                      ...prev,
                                      fecha: texto,
                                    }))
                                  }
                                  placeholder="Fecha (AAAA-MM-DD)"
                                  placeholderTextColor={colors.textMuted}
                                  style={[
                                    styles.input,
                                    {
                                      color: colors.text,
                                      borderColor: colors.border,
                                      backgroundColor: colors.surface,
                                    },
                                  ]}
                                />
                                <TextInput
                                  value={formularioEdicionSesion.hora_inicio}
                                  onChangeText={(texto) =>
                                    setFormularioEdicionSesion((prev) => ({
                                      ...prev,
                                      hora_inicio: texto,
                                    }))
                                  }
                                  placeholder="Hora de inicio (HH:MM)"
                                  placeholderTextColor={colors.textMuted}
                                  style={[
                                    styles.input,
                                    {
                                      color: colors.text,
                                      borderColor: colors.border,
                                      backgroundColor: colors.surface,
                                    },
                                  ]}
                                />
                                <TextInput
                                  value={formularioEdicionSesion.hora_fin}
                                  onChangeText={(texto) =>
                                    setFormularioEdicionSesion((prev) => ({
                                      ...prev,
                                      hora_fin: texto,
                                    }))
                                  }
                                  placeholder="Hora de fin (HH:MM)"
                                  placeholderTextColor={colors.textMuted}
                                  style={[
                                    styles.input,
                                    {
                                      color: colors.text,
                                      borderColor: colors.border,
                                      backgroundColor: colors.surface,
                                    },
                                  ]}
                                />
                                <TextInput
                                  value={formularioEdicionSesion.cupo_maximo}
                                  onChangeText={(texto) =>
                                    setFormularioEdicionSesion((prev) => ({
                                      ...prev,
                                      cupo_maximo: texto,
                                    }))
                                  }
                                  placeholder="Cupo máximo"
                                  keyboardType="numeric"
                                  placeholderTextColor={colors.textMuted}
                                  style={[
                                    styles.input,
                                    {
                                      color: colors.text,
                                      borderColor: colors.border,
                                      backgroundColor: colors.surface,
                                    },
                                  ]}
                                />
                                <View style={styles.actions}>
                                  <Pressable
                                    disabled={sesionBloqueada}
                                    onPress={() =>
                                      handleGuardarEdicionSesion(
                                        item.id_clase,
                                        sesion.id_programacion,
                                      )
                                    }
                                    style={styles.actionButton}>
                                    {sesionBloqueada ? (
                                      <ActivityIndicator size="small" />
                                    ) : (
                                      <ThemedText
                                        style={[styles.actionText, { color: colors.tint }]}>
                                        Guardar
                                      </ThemedText>
                                    )}
                                  </Pressable>
                                  <Pressable
                                    disabled={sesionBloqueada}
                                    onPress={() => setSesionEditando(null)}
                                    style={styles.actionButton}>
                                    <ThemedText
                                      style={[styles.actionText, { color: colors.textMuted }]}>
                                      Cancelar
                                    </ThemedText>
                                  </Pressable>
                                </View>
                              </>
                            ) : (
                              <>
                                <View style={styles.rowHeader}>
                                  <ThemedText style={{ fontWeight: '600' }}>
                                    {formatFecha(sesion.fecha)} ·{' '}
                                    {formatHora(sesion.hora_inicio)} -{' '}
                                    {formatHora(sesion.hora_fin)}
                                  </ThemedText>
                                  <Badge estado={sesion.estado} />
                                </View>
                                <ThemedText style={{ color: colors.textMuted }}>
                                  Cupos: {sesion.cupos_disponibles}/{sesion.cupo_maximo}
                                </ThemedText>

                                {sesion.estado === 'PROGRAMADA' && (
                                  <View style={styles.actions}>
                                    <Pressable
                                      disabled={sesionBloqueada}
                                      onPress={() => iniciarEdicionSesion(sesion)}
                                      style={styles.actionButton}>
                                      <ThemedText
                                        style={[styles.actionText, { color: colors.tint }]}>
                                        Editar
                                      </ThemedText>
                                    </Pressable>
                                    <Pressable
                                      disabled={sesionBloqueada}
                                      onPress={() =>
                                        handleCancelarSesion(item.id_clase, sesion)
                                      }
                                      style={styles.actionButton}>
                                      {sesionBloqueada ? (
                                        <ActivityIndicator size="small" />
                                      ) : (
                                        <ThemedText
                                          style={[styles.actionText, { color: colors.danger }]}>
                                          Cancelar sesión
                                        </ThemedText>
                                      )}
                                    </Pressable>
                                  </View>
                                )}
                              </>
                            )}
                          </View>
                        );
                      })
                    )}
                  </View>
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
  spacingSmall: {
    marginBottom: Spacing.sm,
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
  subseccion: {
    borderTopWidth: 1,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  sesionRow: {
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: 2,
  },
});
