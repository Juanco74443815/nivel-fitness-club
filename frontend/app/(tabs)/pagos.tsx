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

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const METODOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'QR'] as const;
const ESTADOS_FILTRO = ['TODOS', 'PENDIENTE', 'VERIFICADO', 'RECHAZADO', 'ANULADO'] as const;

export default function PagosScreen() {
  const { token, usuario } = useSession();
  const colorScheme = useColorScheme() ?? 'light';
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
      <ThemedView style={styles.container}>
        <ThemedText type="title">Pagos</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
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
            style={[styles.nuevoBoton, { borderColor: Colors[colorScheme].tint }]}>
            <ThemedText style={{ color: Colors[colorScheme].tint, fontWeight: '600' }}>
              {mostrarFormularioNuevo ? 'Cancelar' : '+ Registrar pago'}
            </ThemedText>
          </Pressable>

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
                    onPress={() => seleccionarSocio(s)}
                    style={[styles.resultadoRow, { borderColor: Colors[colorScheme].icon }]}>
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
                            borderColor: Colors[colorScheme].tint,
                            backgroundColor:
                              membresiaSeleccionada?.id_membresia === m.id_membresia
                                ? Colors[colorScheme].tint
                                : 'transparent',
                          },
                        ]}>
                        <ThemedText
                          style={{
                            color:
                              membresiaSeleccionada?.id_membresia === m.id_membresia
                                ? '#fff'
                                : Colors[colorScheme].text,
                            fontSize: 13,
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
                placeholderTextColor={Colors[colorScheme].icon}
                style={[styles.input, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon }]}
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
                        borderColor: Colors[colorScheme].tint,
                        backgroundColor: metodoPago === m ? Colors[colorScheme].tint : 'transparent',
                      },
                    ]}>
                    <ThemedText
                      style={{
                        color: metodoPago === m ? '#fff' : Colors[colorScheme].text,
                        fontSize: 13,
                      }}>
                      {m}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              <Pressable
                disabled={creando}
                onPress={handleRegistrarPago}
                style={[styles.guardarBoton, { backgroundColor: Colors[colorScheme].tint }]}>
                {creando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Registrar pago</ThemedText>
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
                    borderColor: Colors[colorScheme].tint,
                    backgroundColor: filtroEstado === estado ? Colors[colorScheme].tint : 'transparent',
                  },
                ]}>
                <ThemedText
                  style={{
                    color: filtroEstado === estado ? '#fff' : Colors[colorScheme].text,
                    fontSize: 12,
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
        <ThemedText style={[styles.spacing, styles.error]}>{error}</ThemedText>
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
              <View style={[styles.row, { borderColor: Colors[colorScheme].icon }]}>
                {puedeGestionar && (
                  <ThemedText type="defaultSemiBold">
                    {item.socio_nombres} {item.socio_apellidos} ({item.codigo_socio})
                  </ThemedText>
                )}
                <ThemedText>Monto: Bs. {item.monto}</ThemedText>
                <ThemedText>Método: {item.metodo_pago}</ThemedText>
                {item.plan_nombre && <ThemedText>Membresía: {item.plan_nombre}</ThemedText>}
                <ThemedText>Fecha: {formatFecha(item.fecha_pago)}</ThemedText>
                <ThemedText>Estado: {item.estado}</ThemedText>
                {item.observaciones && (
                  <ThemedText>Motivo: {item.observaciones}</ThemedText>
                )}
                {item.comprobante_url && (
                  <Pressable onPress={() => Linking.openURL(`${API_URL}${item.comprobante_url}`)}>
                    <ThemedText style={{ color: Colors[colorScheme].tint }}>
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
                      <ThemedText style={styles.actionText}>
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
                          <ThemedText style={styles.actionText}>Verificar</ThemedText>
                        )}
                      </Pressable>
                    )}
                    {item.estado === 'PENDIENTE' && (
                      <Pressable
                        disabled={bloqueado}
                        onPress={() => iniciarCambioEstado(item)}
                        style={styles.actionButton}>
                        <ThemedText style={styles.actionText}>Rechazar</ThemedText>
                      </Pressable>
                    )}
                    {item.estado === 'VERIFICADO' && esAdministrador && (
                      <Pressable
                        disabled={bloqueado}
                        onPress={() => iniciarCambioEstado(item)}
                        style={styles.actionButton}>
                        <ThemedText style={styles.actionText}>Anular</ThemedText>
                      </Pressable>
                    )}
                  </View>
                )}

                {editandoEstado && (
                  <View style={styles.formulario}>
                    <TextInput
                      value={motivo}
                      onChangeText={setMotivo}
                      placeholder="Motivo *"
                      placeholderTextColor={Colors[colorScheme].icon}
                      style={[styles.input, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon }]}
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
                          <ThemedText style={styles.actionText}>Confirmar</ThemedText>
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
