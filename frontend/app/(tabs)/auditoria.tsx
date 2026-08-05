import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/themed-text';
import { useSession } from '@/context/auth-context';
import { ApiError, listAuditoria, type RegistroAuditoria } from '@/lib/api';
import { Colors, Radius, Spacing, cardShadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AuditoriaScreen() {
  const { token, usuario } = useSession();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
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
      <Screen>
        <ThemedText type="title">Auditoría</ThemedText>
        <ThemedText style={styles.spacing}>No tienes permisos para ver esta sección.</ThemedText>
      </Screen>
    );
  }

  return (
    <Screen wide>
      <ThemedText type="title" style={styles.spacing}>
        Registro de auditoría
      </ThemedText>

      <View style={styles.filaFechas}>
        <TextInput
          value={desde}
          onChangeText={setDesde}
          onSubmitEditing={() => cargar(true)}
          placeholder="Desde AAAA-MM-DD"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            styles.inputFecha,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        />
        <TextInput
          value={hasta}
          onChangeText={setHasta}
          onSubmitEditing={() => cargar(true)}
          placeholder="Hasta AAAA-MM-DD"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            styles.inputFecha,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        />
        <Pressable
          onPress={() => cargar(true)}
          style={[styles.filtrarBoton, { borderColor: colors.tint }]}>
          <ThemedText style={{ color: colors.tint, fontWeight: '700' }}>Filtrar</ThemedText>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.spacing} />
      ) : error ? (
        <View style={[styles.messageBox, { backgroundColor: colors.dangerMuted }]}>
          <ThemedText style={{ color: colors.danger }}>{error}</ThemedText>
        </View>
      ) : (
        <FlatList
          data={registros}
          keyExtractor={(item) => String(item.id_auditoria)}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <ThemedText style={styles.spacing}>No se encontraron registros.</ThemedText>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.row,
                { backgroundColor: colors.surface },
                cardShadow(colorScheme),
              ]}>
              <View style={styles.rowHeader}>
                <ThemedText type="defaultSemiBold">{item.accion}</ThemedText>
                <View style={[styles.entidadPill, { backgroundColor: colors.surfaceAlt }]}>
                  <ThemedText style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>
                    {item.entidad_afectada.toUpperCase()}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={{ color: colors.textMuted }}>
                {item.usuario_nombres} {item.usuario_apellidos}
                {item.id_registro_afectado !== null ? ` · registro #${item.id_registro_afectado}` : ''}
              </ThemedText>
              <ThemedText style={{ color: colors.textMuted, fontSize: 12 }}>
                {item.fecha.slice(0, 19).replace('T', ' ')}
              </ThemedText>
              {item.detalle && <ThemedText>{item.detalle}</ThemedText>}
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  spacing: {
    marginBottom: Spacing.lg,
  },
  filaFechas: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputFecha: {
    flex: 1,
  },
  filtrarBoton: {
    borderWidth: 1.5,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageBox: {
    borderRadius: Radius.sm,
    padding: Spacing.md,
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
  entidadPill: {
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
});
