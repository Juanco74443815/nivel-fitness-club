import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSession } from '@/context/auth-context';
import { ApiError, listAuditoria, type RegistroAuditoria } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AuditoriaScreen() {
  const { token, usuario } = useSession();
  const colorScheme = useColorScheme() ?? 'light';
  const esAdministrador = usuario?.rol === 'Administrador';

  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const cargar = useCallback(
    async (mostrarCargando: boolean) => {
      if (!token || !esAdministrador) {
        setIsLoading(false);
        return;
      }

      if (mostrarCargando) setIsLoading(true);
      setError(null);

      try {
        const data = await listAuditoria(token, {
          desde: desde.trim() || undefined,
          hasta: hasta.trim() || undefined,
        });
        setRegistros(data);
      } catch (fetchError) {
        setError(
          fetchError instanceof ApiError
            ? fetchError.message
            : 'No se pudo consultar el registro de auditoría.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, esAdministrador, desde, hasta],
  );

  useFocusEffect(
    useCallback(() => {
      cargar(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cargar]),
  );

  function onRefresh() {
    setIsRefreshing(true);
    cargar(false);
  }

  if (!esAdministrador) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Auditoría</ThemedText>
        <ThemedText style={styles.spacing}>No tienes permisos para ver esta sección.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.spacing}>
        Registro de auditoría
      </ThemedText>

      <View style={styles.filaFechas}>
        <TextInput
          value={desde}
          onChangeText={setDesde}
          onSubmitEditing={() => cargar(true)}
          placeholder="Desde AAAA-MM-DD"
          placeholderTextColor={Colors[colorScheme].icon}
          style={[styles.input, styles.inputFecha, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon }]}
        />
        <TextInput
          value={hasta}
          onChangeText={setHasta}
          onSubmitEditing={() => cargar(true)}
          placeholder="Hasta AAAA-MM-DD"
          placeholderTextColor={Colors[colorScheme].icon}
          style={[styles.input, styles.inputFecha, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon }]}
        />
        <Pressable
          onPress={() => cargar(true)}
          style={[styles.filtrarBoton, { borderColor: Colors[colorScheme].tint }]}>
          <ThemedText style={{ color: Colors[colorScheme].tint }}>Filtrar</ThemedText>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.spacing} />
      ) : error ? (
        <ThemedText style={[styles.spacing, styles.error]}>{error}</ThemedText>
      ) : (
        <FlatList
          data={registros}
          keyExtractor={(item) => String(item.id_auditoria)}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <ThemedText style={styles.spacing}>No se encontraron registros.</ThemedText>
          }
          renderItem={({ item }) => (
            <View style={[styles.row, { borderColor: Colors[colorScheme].icon }]}>
              <ThemedText type="defaultSemiBold">{item.accion}</ThemedText>
              <ThemedText>
                Usuario: {item.usuario_nombres} {item.usuario_apellidos}
              </ThemedText>
              <ThemedText>Entidad: {item.entidad_afectada}</ThemedText>
              {item.id_registro_afectado !== null && (
                <ThemedText>Registro afectado: #{item.id_registro_afectado}</ThemedText>
              )}
              <ThemedText>Fecha: {item.fecha.slice(0, 19).replace('T', ' ')}</ThemedText>
              {item.detalle && <ThemedText>Detalle: {item.detalle}</ThemedText>}
            </View>
          )}
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
  filaFechas: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  inputFecha: {
    flex: 1,
  },
  filtrarBoton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
});
