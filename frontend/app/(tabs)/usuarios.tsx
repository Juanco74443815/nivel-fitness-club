import { useCallback, useMemo, useState } from 'react';
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
  ApiError,
  cambiarRolUsuario,
  desactivarUsuario,
  listRoles,
  listUsuarios,
  type Rol,
  type UsuarioListado,
} from '@/lib/api';
import { confirmAsync, notify } from '@/lib/confirm';
import { Colors, Radius, Spacing, cardShadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function UsuariosScreen() {
  const { token, usuario } = useSession();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const esAdministrador = usuario?.rol === 'Administrador';

  const [usuarios, setUsuarios] = useState<UsuarioListado[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filaExpandida, setFilaExpandida] = useState<number | null>(null);
  const [procesando, setProcesando] = useState<number | null>(null);

  const cargarDatos = useCallback(
    async (mostrarCargando: boolean) => {
      if (!token || !esAdministrador) {
        setIsLoading(false);
        return;
      }

      if (mostrarCargando) setIsLoading(true);
      setError(null);

      try {
        const [listaUsuarios, listaRoles] = await Promise.all([
          listUsuarios(token),
          listRoles(token),
        ]);
        setUsuarios(listaUsuarios);
        setRoles(listaRoles);
      } catch (fetchError) {
        setError(
          fetchError instanceof ApiError
            ? fetchError.message
            : 'No se pudieron consultar los usuarios.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, esAdministrador],
  );

  useFocusEffect(
    useCallback(() => {
      cargarDatos(true);
    }, [cargarDatos]),
  );

  function onRefresh() {
    setIsRefreshing(true);
    cargarDatos(false);
  }

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return usuarios;

    return usuarios.filter((u) =>
      `${u.nombres} ${u.apellidos} ${u.correo}`.toLowerCase().includes(texto),
    );
  }, [usuarios, busqueda]);

  async function handleCambiarRol(idUsuario: number, idRol: number) {
    if (!token) return;

    setProcesando(idUsuario);

    try {
      const actualizado = await cambiarRolUsuario(token, idUsuario, idRol);
      setUsuarios((prev) =>
        prev.map((u) => (u.id_usuario === idUsuario ? actualizado : u)),
      );
      setFilaExpandida(null);
    } catch (actionError) {
      notify(
        'No se pudo cambiar el rol',
        actionError instanceof ApiError
          ? actionError.message
          : 'Ocurrió un error inesperado.',
      );
    } finally {
      setProcesando(null);
    }
  }

  async function handleDesactivar(usuarioFila: UsuarioListado) {
    const confirmado = await confirmAsync(
      'Desactivar usuario',
      `¿Seguro que deseas desactivar a ${usuarioFila.nombres} ${usuarioFila.apellidos}?`,
      'Desactivar',
    );

    if (!confirmado || !token) return;

    setProcesando(usuarioFila.id_usuario);

    try {
      const actualizado = await desactivarUsuario(token, usuarioFila.id_usuario);
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id_usuario === usuarioFila.id_usuario ? actualizado : u,
        ),
      );
    } catch (actionError) {
      notify(
        'No se pudo desactivar',
        actionError instanceof ApiError
          ? actionError.message
          : 'Ocurrió un error inesperado.',
      );
    } finally {
      setProcesando(null);
    }
  }

  if (!esAdministrador) {
    return (
      <Screen>
        <ThemedText type="title">Usuarios</ThemedText>
        <ThemedText style={styles.spacing}>
          No tienes permisos para ver esta sección.
        </ThemedText>
      </Screen>
    );
  }

  return (
    <Screen>
      <ThemedText type="title" style={styles.spacing}>
        Usuarios
      </ThemedText>

      <TextInput
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder="Buscar por nombre o correo"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.search,
          { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      />

      {isLoading ? (
        <ActivityIndicator style={styles.spacing} />
      ) : error ? (
        <View style={[styles.messageBox, { backgroundColor: colors.dangerMuted }]}>
          <ThemedText style={{ color: colors.danger }}>{error}</ThemedText>
        </View>
      ) : (
        <FlatList
          data={usuariosFiltrados}
          keyExtractor={(item) => String(item.id_usuario)}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <ThemedText style={styles.spacing}>
              No se encontraron usuarios.
            </ThemedText>
          }
          renderItem={({ item }) => {
            const esUnoMismo = item.id_usuario === usuario?.id_usuario;
            const expandido = filaExpandida === item.id_usuario;
            const bloqueado = procesando === item.id_usuario;

            return (
              <View
                style={[
                  styles.row,
                  { backgroundColor: colors.surface },
                  cardShadow(colorScheme),
                ]}>
                <View style={styles.rowHeader}>
                  <ThemedText type="defaultSemiBold">
                    {item.nombres} {item.apellidos}
                  </ThemedText>
                  <Badge estado={item.estado} />
                </View>
                <ThemedText style={{ color: colors.textMuted }}>{item.correo}</ThemedText>
                <ThemedText style={{ color: colors.textMuted }}>Rol: {item.rol}</ThemedText>

                {esUnoMismo ? (
                  <ThemedText style={[styles.hint, { color: colors.textMuted }]}>
                    Esta es tu propia cuenta: no puedes cambiar tu rol ni
                    desactivarla.
                  </ThemedText>
                ) : (
                  <View style={styles.actions}>
                    <Pressable
                      disabled={bloqueado}
                      onPress={() =>
                        setFilaExpandida(expandido ? null : item.id_usuario)
                      }
                      style={styles.actionButton}>
                      <ThemedText style={[styles.actionText, { color: colors.tint }]}>
                        Cambiar rol
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

                {expandido && (
                  <View style={styles.roleChips}>
                    {roles.map((rol) => (
                      <Pressable
                        key={rol.id_rol}
                        disabled={bloqueado || rol.id_rol === item.id_rol}
                        onPress={() => handleCambiarRol(item.id_usuario, rol.id_rol)}
                        style={[
                          styles.chip,
                          {
                            borderColor: colors.tint,
                            opacity: rol.id_rol === item.id_rol ? 0.4 : 1,
                          },
                        ]}>
                        <ThemedText style={[styles.chipText, { color: colors.tint }]}>
                          {rol.nombre}
                        </ThemedText>
                      </Pressable>
                    ))}
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
    marginBottom: Spacing.lg,
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
  hint: {
    fontSize: 12,
    marginTop: 6,
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
  roleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
