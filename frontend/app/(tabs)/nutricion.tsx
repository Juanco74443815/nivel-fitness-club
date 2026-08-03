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

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSession } from '@/context/auth-context';
import {
  API_URL,
  ApiError,
  cargarFotoAlimento,
  listMisConsultasNutricionales,
  type ConsultaNutricional,
} from '@/lib/api';
import { notify } from '@/lib/confirm';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function NutricionScreen() {
  const { token, usuario } = useSession();
  const colorScheme = useColorScheme() ?? 'light';
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
      <ThemedView style={styles.container}>
        <ThemedText type="title">Nutrición</ThemedText>
        <ThemedText style={styles.spacing}>No tienes permisos para ver esta sección.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.spacing}>
        Estimación nutricional
      </ThemedText>
      <ThemedText style={styles.spacing}>
        Estimación referencial generada por inteligencia artificial. No reemplaza la evaluación de
        un nutricionista ni constituye un diagnóstico médico.
      </ThemedText>

      <Pressable
        disabled={subiendo}
        onPress={handleCargarFoto}
        style={[styles.boton, { backgroundColor: Colors[colorScheme].tint }]}>
        {subiendo ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={{ color: '#fff', fontWeight: '600' }}>
            + Cargar fotografía de alimento
          </ThemedText>
        )}
      </Pressable>

      {isLoading ? (
        <ActivityIndicator style={styles.spacing} />
      ) : error ? (
        <ThemedText style={[styles.spacing, styles.error]}>{error}</ThemedText>
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
            <View style={[styles.row, { borderColor: Colors[colorScheme].icon }]}>
              <Image source={{ uri: `${API_URL}${item.imagen_url}` }} style={styles.imagen} />
              <ThemedText type="defaultSemiBold">{item.alimentos_detectados}</ThemedText>
              {item.estado === 'COMPLETADO' && (
                <>
                  <ThemedText>Calorías: {item.calorias_estimadas} kcal</ThemedText>
                  <ThemedText>Proteínas: {item.proteinas_g} g</ThemedText>
                  <ThemedText>Carbohidratos: {item.carbohidratos_g} g</ThemedText>
                  <ThemedText>Grasas: {item.grasas_g} g</ThemedText>
                </>
              )}
              <ThemedText>Estado: {item.estado}</ThemedText>
              <ThemedText>Fecha: {item.fecha_consulta.slice(0, 19).replace('T', ' ')}</ThemedText>
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
  spacingTop: {
    marginTop: 12,
  },
  boton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
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
  imagen: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
  },
});
