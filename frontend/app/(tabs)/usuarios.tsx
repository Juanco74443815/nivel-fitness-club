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

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function UsuariosScreen() {
  const { token, usuario } = useSession();
  const colorScheme = useColorScheme() ?? 'light';
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
      <ThemedView style={styles.container}>
        <ThemedText type="title">Usuarios</ThemedText>
        <ThemedText style={styles.spacing}>
          No tienes permisos para ver esta sección.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.spacing}>
        Usuarios
      </ThemedText>

      <TextInput
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder="Buscar por nombre o correo"
        placeholderTextColor={Colors[colorScheme].icon}
        style={[
          styles.search,
          { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon },
        ]}
      />

      {isLoading ? (
        <ActivityIndicator style={styles.spacing} />
      ) : error ? (
        <ThemedText style={[styles.spacing, styles.error]}>{error}</ThemedText>
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
                  { borderColor: Colors[colorScheme].icon },
                ]}>
                <ThemedText type="defaultSemiBold">
                  {item.nombres} {item.apellidos}
                </ThemedText>
                <ThemedText>{item.correo}</ThemedText>
                <ThemedText>
                  Rol: {item.rol} · Estado: {item.estado}
                </ThemedText>

                {esUnoMismo ? (
                  <ThemedText style={styles.hint}>
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
                      <ThemedText style={styles.actionText}>
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
                          <ThemedText style={[styles.actionText, styles.error]}>
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
                            borderColor: Colors[colorScheme].tint,
                            opacity: rol.id_rol === item.id_rol ? 0.4 : 1,
                          },
                        ]}>
                        <ThemedText style={styles.chipText}>
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
    marginBottom: 16,
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
  hint: {
    opacity: 0.6,
    fontSize: 12,
    marginTop: 6,
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
  roleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 13,
  },
});
