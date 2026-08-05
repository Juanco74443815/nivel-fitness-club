import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/themed-text';
import { useSession } from '@/context/auth-context';
import {
  API_URL,
  ApiError,
  cargarFotoAlimento,
  listMisConsultasNutricionales,
  type ConsultaNutricional,
} from '@/lib/api';
import { notify } from '@/lib/confirm';
import { Colors, Radius, Spacing, cardShadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function NutricionScreen() {
  const { token, usuario } = useSession();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const esSocio = usuario?.rol === 'Socio';

  const [consultas, setConsultas] = useState<ConsultaNutricional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const cargar = useCallback(
    async (mostrarCargando: boolean) => {
      if (!token || !esSocio) {
        setIsLoading(false);
        return;
      }

      if (mostrarCargando) setIsLoading(true);
      setError(null);

      try {
        const data = await listMisConsultasNutricionales(token);
        setConsultas(data);
      } catch (fetchError) {
        setError(
          fetchError instanceof ApiError
            ? fetchError.message
            : 'No se pudo consultar el historial nutricional.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, esSocio],
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

  async function handleCargarFoto() {
    if (!token) return;

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (resultado.canceled || resultado.assets.length === 0) return;

    const asset = resultado.assets[0];

    setSubiendo(true);

    try {
      const consulta = await cargarFotoAlimento(token, {
        uri: asset.uri,
        name: asset.fileName ?? `alimento-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
        file: asset.file,
      });

      setConsultas((prev) => [consulta, ...prev]);

      if (consulta.estado === 'ERROR') {
        notify(
          'No se pudo identificar el alimento',
          `${consulta.alimentos_detectados} Puedes intentar nuevamente con otra fotografía.`,
        );
      } else {
        notify(
          'Estimación lista',
          'Recuerda que es una estimación referencial y no reemplaza a un nutricionista.',
        );
      }
    } catch (uploadError) {
      notify(
        'No se pudo procesar la fotografía',
        uploadError instanceof ApiError ? uploadError.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setSubiendo(false);
    }
  }

  if (!esSocio) {
    return (
      <Screen>
        <ThemedText type="title">Nutrición</ThemedText>
        <ThemedText style={styles.spacing}>No tienes permisos para ver esta sección.</ThemedText>
      </Screen>
    );
  }

  return (
    <Screen>
      <ThemedText type="title" style={styles.spacing}>
        Estimación nutricional
      </ThemedText>
      <View style={[styles.disclaimer, { backgroundColor: colors.warningMuted }]}>
        <ThemedText style={{ color: colors.warning, fontSize: 13, lineHeight: 18 }}>
          Estimación referencial generada por inteligencia artificial. No reemplaza la
          evaluación de un nutricionista ni constituye un diagnóstico médico.
        </ThemedText>
      </View>

      <Pressable
        disabled={subiendo}
        onPress={handleCargarFoto}
        style={[styles.boton, { backgroundColor: colors.tint }]}>
        {subiendo ? (
          <ActivityIndicator color={colors.tintOn} />
        ) : (
          <ThemedText style={{ color: colors.tintOn, fontWeight: '700' }}>
            + Cargar fotografía de alimento
          </ThemedText>
        )}
      </Pressable>

      {isLoading ? (
        <ActivityIndicator style={styles.spacing} />
      ) : error ? (
        <View style={[styles.messageBox, { backgroundColor: colors.dangerMuted }]}>
          <ThemedText style={{ color: colors.danger }}>{error}</ThemedText>
        </View>
      ) : (
        <FlatList
          data={consultas}
          keyExtractor={(item) => String(item.id_consulta)}
          style={styles.spacingTop}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <ThemedText style={styles.spacing}>No has cargado ninguna fotografía todavía.</ThemedText>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.row,
                { backgroundColor: colors.surface },
                cardShadow(colorScheme),
              ]}>
              <Image source={{ uri: `${API_URL}${item.imagen_url}` }} style={styles.imagen} />
              <View style={styles.rowContent}>
                <View style={styles.rowHeader}>
                  <ThemedText type="defaultSemiBold" style={styles.flexShrink}>
                    {item.alimentos_detectados}
                  </ThemedText>
                  <Badge estado={item.estado} />
                </View>
                {item.estado === 'COMPLETADO' && (
                  <View style={styles.macros}>
                    <View style={styles.macro}>
                      <ThemedText style={[styles.macroValor, { color: colors.tint }]}>
                        {item.calorias_estimadas}
                      </ThemedText>
                      <ThemedText style={[styles.macroLabel, { color: colors.textMuted }]}>
                        kcal
                      </ThemedText>
                    </View>
                    <View style={styles.macro}>
                      <ThemedText style={styles.macroValor}>{item.proteinas_g} g</ThemedText>
                      <ThemedText style={[styles.macroLabel, { color: colors.textMuted }]}>
                        Proteína
                      </ThemedText>
                    </View>
                    <View style={styles.macro}>
                      <ThemedText style={styles.macroValor}>{item.carbohidratos_g} g</ThemedText>
                      <ThemedText style={[styles.macroLabel, { color: colors.textMuted }]}>
                        Carbos
                      </ThemedText>
                    </View>
                    <View style={styles.macro}>
                      <ThemedText style={styles.macroValor}>{item.grasas_g} g</ThemedText>
                      <ThemedText style={[styles.macroLabel, { color: colors.textMuted }]}>
                        Grasas
                      </ThemedText>
                    </View>
                  </View>
                )}
                <ThemedText style={{ color: colors.textMuted, fontSize: 12 }}>
                  {item.fecha_consulta.slice(0, 19).replace('T', ' ')}
                </ThemedText>
              </View>
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
  spacingTop: {
    marginTop: Spacing.md,
  },
  disclaimer: {
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  boton: {
    borderRadius: Radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  messageBox: {
    borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  row: {
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  imagen: {
    width: '100%',
    height: 160,
  },
  rowContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  flexShrink: {
    flexShrink: 1,
  },
  macros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  macro: {
    minWidth: 60,
  },
  macroValor: {
    fontSize: 16,
    fontWeight: '700',
  },
  macroLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
