import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSession } from '@/context/auth-context';
import { ApiError, generarReporte, type ReporteResultado } from '@/lib/api';
import { notify } from '@/lib/confirm';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const TIPOS_REPORTE = ['socios', 'reservas', 'membresias', 'pagos'] as const;

function hoyIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function primerDiaMesIso(): string {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
}

export default function ReportesScreen() {
  const { token, usuario } = useSession();
  const colorScheme = useColorScheme() ?? 'light';
  const esAdministrador = usuario?.rol === 'Administrador';

  const [tipo, setTipo] = useState<(typeof TIPOS_REPORTE)[number]>('pagos');
  const [desde, setDesde] = useState(primerDiaMesIso());
  const [hasta, setHasta] = useState(hoyIso());
  const [reporte, setReporte] = useState<ReporteResultado | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleGenerar() {
    if (!token) return;

    setCargando(true);
    setReporte(null);

    try {
      const resultado = await generarReporte(token, { tipo, desde, hasta });
      setReporte(resultado);
    } catch (fetchError) {
      notify(
        'No se pudo generar el reporte',
        fetchError instanceof ApiError ? fetchError.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setCargando(false);
    }
  }

  if (!esAdministrador) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Reportes</ThemedText>
        <ThemedText style={styles.spacing}>No tienes permisos para ver esta sección.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.spacing}>
        Reportes administrativos
      </ThemedText>

      <ThemedText type="defaultSemiBold">Tipo de reporte</ThemedText>
      <View style={styles.filtros}>
        {TIPOS_REPORTE.map((t) => (
          <Pressable
            key={t}
            onPress={() => setTipo(t)}
            style={[
              styles.chip,
              {
                borderColor: Colors[colorScheme].tint,
                backgroundColor: tipo === t ? Colors[colorScheme].tint : 'transparent',
              },
            ]}>
            <ThemedText style={{ color: tipo === t ? '#fff' : Colors[colorScheme].text, fontSize: 13 }}>
              {t}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ThemedText type="defaultSemiBold" style={styles.spacingTop}>
        Rango de fechas
      </ThemedText>
      <View style={styles.filaFechas}>
        <TextInput
          value={desde}
          onChangeText={setDesde}
          placeholder="Desde AAAA-MM-DD"
          placeholderTextColor={Colors[colorScheme].icon}
          style={[styles.input, styles.inputFecha, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon }]}
        />
        <TextInput
          value={hasta}
          onChangeText={setHasta}
          placeholder="Hasta AAAA-MM-DD"
          placeholderTextColor={Colors[colorScheme].icon}
          style={[styles.input, styles.inputFecha, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].icon }]}
        />
      </View>

      <Pressable
        disabled={cargando}
        onPress={handleGenerar}
        style={[styles.guardarBoton, { backgroundColor: Colors[colorScheme].tint }]}>
        {cargando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Generar reporte</ThemedText>
        )}
      </Pressable>

      {reporte && (
        <>
          <View style={[styles.resumen, { borderColor: Colors[colorScheme].icon }]}>
            <ThemedText type="defaultSemiBold">Resumen</ThemedText>
            {Object.entries(reporte.resumen).map(([clave, valor]) => (
              <ThemedText key={clave}>
                {clave.replace(/_/g, ' ')}: {valor}
              </ThemedText>
            ))}
          </View>

          <FlatList
            data={reporte.datos}
            keyExtractor={(_item, index) => String(index)}
            style={styles.spacingTop}
            ListEmptyComponent={
              <ThemedText style={styles.spacing}>No hay datos en el periodo seleccionado.</ThemedText>
            }
            renderItem={({ item }) => (
              <View style={[styles.row, { borderColor: Colors[colorScheme].icon }]}>
                {Object.entries(item).map(([clave, valor]) => (
                  <ThemedText key={clave} style={styles.filaDato}>
                    {clave.replace(/_/g, ' ')}: {String(valor)}
                  </ThemedText>
                ))}
              </View>
            )}
          />
        </>
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
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filaFechas: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  inputFecha: {
    flex: 1,
  },
  guardarBoton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  resumen: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    gap: 4,
  },
  row: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 2,
  },
  filaDato: {
    fontSize: 13,
  },
});
