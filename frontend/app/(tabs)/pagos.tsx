import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  FlatList,
  Linking,
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
  API_URL,
  ApiError,
  actualizarEstadoPago,
  cargarComprobantePago,
  listMembresias,
  listMisPagos,
  listPagos,
  listSocios,
  registrarPago,
  type Membresia,
  type Pago,
  type SocioListado,
} from '@/lib/api';
import { confirmAsync, notify } from '@/lib/confirm';
import { formatFecha } from '@/lib/format';
import { Colors, Radius, Spacing, cardShadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const METODOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'QR'] as const;
const ESTADOS_FILTRO = ['TODOS', 'PENDIENTE', 'VERIFICADO', 'RECHAZADO', 'ANULADO'] as const;

export default function PagosScreen() {
  const { token, usuario } = useSession();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const puedeGestionar =
    usuario?.rol === 'Administrador' || usuario?.rol === 'Recepcionista';
  const esAdministrador = usuario?.rol === 'Administrador';
  const esSocio = usuario?.rol === 'Socio';

  const [pagos, setPagos] = useState<Pago[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<(typeof ESTADOS_FILTRO)[number]>('TODOS');

  const [mostrarFormularioNuevo, setMostrarFormularioNuevo] = useState(false);
  const [busquedaSocio, setBusquedaSocio] = useState('');
  const [resultadosSocio, setResultadosSocio] = useState<SocioListado[]>([]);
  const [socioSeleccionado, setSocioSeleccionado] = useState<SocioListado | null>(null);
  const [membresiasSocio, setMembresiasSocio] = useState<Membresia[]>([]);
  const [membresiaSeleccionada, setMembresiaSeleccionada] = useState<Membresia | null>(null);
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState<(typeof METODOS_PAGO)[number]>('EFECTIVO');
  const [creando, setCreando] = useState(false);

  const [filaEditandoEstado, setFilaEditandoEstado] = useState<number | null>(null);
  const [motivo, setMotivo] = useState('');

  const cargarPagos = useCallback(
    async (mostrarCargando: boolean) => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      if (mostrarCargando) setIsLoading(true);
      setError(null);

      try {
        const data = esSocio
          ? await listMisPagos(token)
          : await listPagos(token, filtroEstado === 'TODOS' ? {} : { estado: filtroEstado });
        setPagos(data);
      } catch (fetchError) {
        setError(
          fetchError instanceof ApiError
            ? fetchError.message
            : 'No se pudieron consultar los pagos.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, esSocio, filtroEstado],
  );

  useFocusEffect(
    useCallback(() => {
      cargarPagos(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cargarPagos]),
  );

  function onRefresh() {
    setIsRefreshing(true);
    cargarPagos(false);
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

  async function seleccionarSocio(socio: SocioListado) {
    setSocioSeleccionado(socio);
    setResultadosSocio([]);
    setMembresiaSeleccionada(null);

    if (!token) return;

    try {
      const todas = await listMembresias(token);
      setMembresiasSocio(
        todas.filter(
          (m) => m.id_socio === socio.id_socio && (m.estado === 'ACTIVA' || m.estado === 'PENDIENTE'),
        ),
      );
    } catch {
      setMembresiasSocio([]);
    }
  }

  function limpiarFormularioNuevo() {
    setSocioSeleccionado(null);
    setMembresiasSocio([]);
    setMembresiaSeleccionada(null);
    setMonto('');
    setMetodoPago('EFECTIVO');
    setBusquedaSocio('');
    setResultadosSocio([]);
  }

  async function handleRegistrarPago() {
    if (!token || !socioSeleccionado) {
      notify('Datos incompletos', 'Selecciona un socio.');
      return;
    }

    const montoNumero = Number(monto);
    if (!monto.trim() || Number.isNaN(montoNumero) || montoNumero <= 0) {
      notify('Monto inválido', 'Ingresa un monto positivo.');
      return;
    }

    setCreando(true);

    try {
      await registrarPago(token, {
        id_socio: socioSeleccionado.id_socio,
        id_membresia: membresiaSeleccionada?.id_membresia,
        monto: montoNumero,
        metodo_pago: metodoPago,
      });
      setMostrarFormularioNuevo(false);
      limpiarFormularioNuevo();
      cargarPagos(false);
    } catch (createError) {
      notify(
        'No se pudo registrar el pago',
        createError instanceof ApiError ? createError.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setCreando(false);
    }
  }

  function iniciarCambioEstado(pago: Pago) {
    setFilaEditandoEstado(pago.id_pago);
    setMotivo('');
  }

  async function handleActualizarEstado(idPago: number, estado: string) {
    if (!token) return;

    if (estado !== 'VERIFICADO' && !motivo.trim()) {
      notify('Motivo requerido', 'Debes indicar el motivo.');
      return;
    }

    setProcesando(idPago);

    try {
      const actualizado = await actualizarEstadoPago(token, idPago, {
        estado,
        motivo: estado === 'VERIFICADO' ? undefined : motivo.trim(),
      });
      setPagos((prev) => prev.map((p) => (p.id_pago === idPago ? actualizado : p)));
      setFilaEditandoEstado(null);
    } catch (updateError) {
      notify(
        'No se pudo actualizar el pago',
        updateError instanceof ApiError ? updateError.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setProcesando(null);
    }
  }

  async function handleCargarComprobante(pago: Pago) {
    if (!token) return;

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (resultado.canceled || resultado.assets.length === 0) return;

    const asset = resultado.assets[0];

    setProcesando(pago.id_pago);

    try {
      const actualizado = await cargarComprobantePago(token, pago.id_pago, {
        uri: asset.uri,
        name: asset.fileName ?? `comprobante-${pago.id_pago}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
        file: asset.file,
      });
      setPagos((prev) => prev.map((p) => (p.id_pago === pago.id_pago ? actualizado : p)));
      notify('Comprobante cargado', 'Tu comprobante quedó registrado, pendiente de verificación.');
    } catch (uploadError) {
      notify(
        'No se pudo cargar el comprobante',
        uploadError instanceof ApiError ? uploadError.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setProcesando(null);
    }
  }

  if (!token || !usuario) {
    return (
      <Screen>
        <ThemedText type="title">Pagos</ThemedText>
      </Screen>
    );
  }

  return (
    <Screen wide>
      <ThemedText type="title" style={styles.spacing}>
        Pagos
      </ThemedText>

      {puedeGestionar && (
        <>
          <Pressable
            onPress={() => {
              setMostrarFormularioNuevo((v) => !v);
              if (mostrarFormularioNuevo) limpiarFormularioNuevo();
            }}
            style={[styles.nuevoBoton, { borderColor: colors.tint }]}>
            <ThemedText style={{ color: colors.tint, fontWeight: '700' }}>
              {mostrarFormularioNuevo ? 'Cancelar' : '+ Registrar pago'}
            </ThemedText>
          </Pressable>

          {mostrarFormularioNuevo && (
            <View
              style={[
                styles.formulario,
                { backgroundColor: colors.surface },
                cardShadow(colorScheme),
              ]}>
              <ThemedText type="defaultSemiBold">1. Buscar socio</ThemedText>
              <TextInput
                value={busquedaSocio}
                onChangeText={setBusquedaSocio}
                onSubmitEditing={handleBuscarSocio}
                placeholder="Nombre, CI o código del socio"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
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
                    onPress={() => seleccionarSocio(s)}
                    style={[styles.resultadoRow, { borderColor: colors.border }]}>
                    <ThemedText>
                      {s.nombres} {s.apellidos} ({s.codigo_socio})
                    </ThemedText>
                  </Pressable>
                ))
              )}

              {socioSeleccionado && membresiasSocio.length > 0 && (
                <>
                  <ThemedText type="defaultSemiBold" style={styles.spacingTop}>
                    2. Membresía asociada (opcional)
                  </ThemedText>
                  <View style={styles.filtros}>
                    {membresiasSocio.map((m) => (
                      <Pressable
                        key={m.id_membresia}
                        onPress={() =>
                          setMembresiaSeleccionada(
                            membresiaSeleccionada?.id_membresia === m.id_membresia ? null : m,
                          )
                        }
                        style={[
                          styles.chip,
                          {
                            borderColor: colors.tint,
                            backgroundColor:
                              membresiaSeleccionada?.id_membresia === m.id_membresia
                                ? colors.tint
                                : colors.background,
                          },
                        ]}>
                        <ThemedText
                          style={{
                            color:
                              membresiaSeleccionada?.id_membresia === m.id_membresia
                                ? colors.tintOn
                                : colors.text,
                            fontSize: 13,
                            fontWeight: '600',
                          }}>
                          {m.plan_nombre}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              <ThemedText type="defaultSemiBold" style={styles.spacingTop}>
                3. Monto
              </ThemedText>
              <TextInput
                value={monto}
                onChangeText={setMonto}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              />

              <ThemedText type="defaultSemiBold" style={styles.spacingTop}>
                4. Método de pago
              </ThemedText>
              <View style={styles.filtros}>
                {METODOS_PAGO.map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => setMetodoPago(m)}
                    style={[
                      styles.chip,
                      {
                        borderColor: colors.tint,
                        backgroundColor: metodoPago === m ? colors.tint : colors.background,
                      },
                    ]}>
                    <ThemedText
                      style={{
                        color: metodoPago === m ? colors.tintOn : colors.text,
                        fontSize: 13,
                        fontWeight: '600',
                      }}>
                      {m}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              <Pressable
                disabled={creando}
                onPress={handleRegistrarPago}
                style={[styles.guardarBoton, { backgroundColor: colors.tint }]}>
                {creando ? (
                  <ActivityIndicator color={colors.tintOn} />
                ) : (
                  <ThemedText style={{ color: colors.tintOn, fontWeight: '700' }}>
                    Registrar pago
                  </ThemedText>
                )}
              </Pressable>
            </View>
          )}

          <View style={styles.filtros}>
            {ESTADOS_FILTRO.map((estado) => (
              <Pressable
                key={estado}
                onPress={() => setFiltroEstado(estado)}
                style={[
                  styles.chip,
                  {
                    borderColor: filtroEstado === estado ? colors.tint : colors.border,
                    backgroundColor: filtroEstado === estado ? colors.tint : colors.surface,
                  },
                ]}>
                <ThemedText
                  style={{
                    color: filtroEstado === estado ? colors.tintOn : colors.text,
                    fontSize: 12,
                    fontWeight: '600',
                  }}>
                  {estado}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {isLoading ? (
        <ActivityIndicator style={styles.spacing} />
      ) : error ? (
        <View style={[styles.messageBox, { backgroundColor: colors.dangerMuted }]}>
          <ThemedText style={{ color: colors.danger }}>{error}</ThemedText>
        </View>
      ) : (
        <FlatList
          data={pagos}
          keyExtractor={(item) => String(item.id_pago)}
          extraData={[procesando, filaEditandoEstado, motivo]}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <ThemedText style={styles.spacing}>No se encontraron pagos.</ThemedText>
          }
          renderItem={({ item }) => {
            const bloqueado = procesando === item.id_pago;
            const editandoEstado = filaEditandoEstado === item.id_pago;

            return (
              <View
                style={[
                  styles.row,
                  { backgroundColor: colors.surface },
                  cardShadow(colorScheme),
                ]}>
                <View style={styles.rowHeader}>
                  {puedeGestionar ? (
                    <ThemedText type="defaultSemiBold">
                      {item.socio_nombres} {item.socio_apellidos} ({item.codigo_socio})
                    </ThemedText>
                  ) : (
                    <ThemedText type="defaultSemiBold">{item.metodo_pago}</ThemedText>
                  )}
                  <Badge estado={item.estado} />
                </View>
                <ThemedText style={[styles.monto, { color: colors.tint }]}>
                  Bs. {item.monto}
                </ThemedText>
                {puedeGestionar && (
                  <ThemedText style={{ color: colors.textMuted }}>Método: {item.metodo_pago}</ThemedText>
                )}
                {item.plan_nombre && (
                  <ThemedText style={{ color: colors.textMuted }}>Membresía: {item.plan_nombre}</ThemedText>
                )}
                <ThemedText style={{ color: colors.textMuted }}>
                  Fecha: {formatFecha(item.fecha_pago)}
                </ThemedText>
                {item.observaciones && (
                  <ThemedText style={{ color: colors.textMuted }}>
                    Motivo: {item.observaciones}
                  </ThemedText>
                )}
                {item.comprobante_url && (
                  <Pressable onPress={() => Linking.openURL(`${API_URL}${item.comprobante_url}`)}>
                    <ThemedText style={{ color: colors.accent, fontWeight: '600' }}>
                      Ver comprobante
                    </ThemedText>
                  </Pressable>
                )}

                {esSocio && item.estado === 'PENDIENTE' && (
                  <Pressable
                    disabled={bloqueado}
                    onPress={() => handleCargarComprobante(item)}
                    style={styles.actionButton}>
                    {bloqueado ? (
                      <ActivityIndicator size="small" />
                    ) : (
                      <ThemedText style={[styles.actionText, { color: colors.tint }]}>
                        {item.comprobante_url ? 'Reemplazar comprobante' : 'Cargar comprobante'}
                      </ThemedText>
                    )}
                  </Pressable>
                )}

                {puedeGestionar && !editandoEstado && item.estado !== 'ANULADO' && (
                  <View style={styles.actions}>
                    {item.estado === 'PENDIENTE' && (
                      <Pressable
                        disabled={bloqueado}
                        onPress={() => handleActualizarEstado(item.id_pago, 'VERIFICADO')}
                        style={styles.actionButton}>
                        {bloqueado ? (
                          <ActivityIndicator size="small" />
                        ) : (
                          <ThemedText style={[styles.actionText, { color: colors.success }]}>
                            Verificar
                          </ThemedText>
                        )}
                      </Pressable>
                    )}
                    {item.estado === 'PENDIENTE' && (
                      <Pressable
                        disabled={bloqueado}
                        onPress={() => iniciarCambioEstado(item)}
                        style={styles.actionButton}>
                        <ThemedText style={[styles.actionText, { color: colors.danger }]}>
                          Rechazar
                        </ThemedText>
                      </Pressable>
                    )}
                    {item.estado === 'VERIFICADO' && esAdministrador && (
                      <Pressable
                        disabled={bloqueado}
                        onPress={() => iniciarCambioEstado(item)}
                        style={styles.actionButton}>
                        <ThemedText style={[styles.actionText, { color: colors.danger }]}>
                          Anular
                        </ThemedText>
                      </Pressable>
                    )}
                  </View>
                )}

                {editandoEstado && (
                  <View style={[styles.formulario, { backgroundColor: colors.background, marginBottom: 0 }]}>
                    <TextInput
                      value={motivo}
                      onChangeText={setMotivo}
                      placeholder="Motivo *"
                      placeholderTextColor={colors.textMuted}
                      style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                    />
                    <View style={styles.actions}>
                      <Pressable
                        disabled={bloqueado}
                        onPress={() =>
                          handleActualizarEstado(
                            item.id_pago,
                            item.estado === 'PENDIENTE' ? 'RECHAZADO' : 'ANULADO',
                          )
                        }
                        style={styles.actionButton}>
                        {bloqueado ? (
                          <ActivityIndicator size="small" />
                        ) : (
                          <ThemedText style={[styles.actionText, { color: colors.tint }]}>
                            Confirmar
                          </ThemedText>
                        )}
                      </Pressable>
                      <Pressable
                        disabled={bloqueado}
                        onPress={() => setFilaEditandoEstado(null)}
                        style={styles.actionButton}>
                        <ThemedText style={[styles.actionText, { color: colors.textMuted }]}>
                          Cancelar
                        </ThemedText>
                      </Pressable>
                    </View>
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
  spacingTop: {
    marginTop: Spacing.md,
  },
  messageBox: {
    borderRadius: Radius.sm,
    padding: Spacing.md,
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
  resultadoRow: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: 10,
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
  monto: {
    fontWeight: '700',
    fontSize: 17,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingVertical: 4,
    marginTop: Spacing.xs,
  },
  actionText: {
    fontWeight: '700',
  },
});
