import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/themed-text';
import { useSession } from '@/context/auth-context';
import { ApiError, generarReporte, type ReporteResultado } from '@/lib/api';
import { notify } from '@/lib/confirm';
import { Colors, Radius, Spacing, cardShadow } from '@/constants/theme';
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
  const colors = Colors[colorScheme];
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
      <Screen>
        <ThemedText type="title">Reportes</ThemedText>
        <ThemedText style={styles.spacing}>No tienes permisos para ver esta sección.</ThemedText>
      </Screen>
    );
  }

  return (
    <Screen wide>
      <ThemedText type="title" style={styles.spacing}>
        Reportes administrativos
      </ThemedText>

      <View
        style={[
          styles.panel,
          { backgroundColor: colors.surface },
          cardShadow(colorScheme),
        ]}>
        <ThemedText style={[styles.label, { color: colors.textMuted }]}>
          Tipo de reporte
        </ThemedText>
        <View style={styles.filtros}>
          {TIPOS_REPORTE.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTipo(t)}
              style={[
                styles.chip,
                {
                  borderColor: tipo === t ? colors.tint : colors.border,
                  backgroundColor: tipo === t ? colors.tint : colors.background,
                },
              ]}>
              <ThemedText
                style={{ color: tipo === t ? colors.tintOn : colors.text, fontSize: 13, fontWeight: '600' }}>
                {t}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText style={[styles.label, styles.spacingTop, { color: colors.textMuted }]}>
          Rango de fechas
        </ThemedText>
        <View style={styles.filaFechas}>
          <TextInput
            value={desde}
            onChangeText={setDesde}
            placeholder="Desde AAAA-MM-DD"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              styles.inputFecha,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
            ]}
          />
          <TextInput
            value={hasta}
            onChangeText={setHasta}
            placeholder="Hasta AAAA-MM-DD"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              styles.inputFecha,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
            ]}
          />
        </View>

        <Pressable
          disabled={cargando}
          onPress={handleGenerar}
          style={[styles.guardarBoton, { backgroundColor: colors.tint }]}>
          {cargando ? (
            <ActivityIndicator color={colors.tintOn} />
          ) : (
            <ThemedText style={{ color: colors.tintOn, fontWeight: '700' }}>
              Generar reporte
            </ThemedText>
          )}
        </Pressable>
      </View>

      {reporte && (
        <>
          <View
            style={[
              styles.resumen,
              { backgroundColor: colors.surfaceAlt },
              cardShadow(colorScheme),
            ]}>
            <ThemedText type="defaultSemiBold" style={styles.spacingSmall}>
              Resumen
            </ThemedText>
            <View style={styles.resumenGrid}>
              {Object.entries(reporte.resumen).map(([clave, valor]) => (
                <View key={clave} style={styles.resumenItem}>
                  <ThemedText style={[styles.resumenValor, { color: colors.tint }]}>
                    {valor}
                  </ThemedText>
                  <ThemedText style={[styles.resumenLabel, { color: colors.textMuted }]}>
                    {clave.replace(/_/g, ' ')}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

          <FlatList
            data={reporte.datos}
            keyExtractor={(_item, index) => String(index)}
            style={styles.spacingTop}
            ListEmptyComponent={
              <ThemedText style={styles.spacing}>No hay datos en el periodo seleccionado.</ThemedText>
            }
            renderItem={({ item }) => (
              <View
                style={[
                  styles.row,
                  { backgroundColor: colors.surface },
                  cardShadow(colorScheme),
                ]}>
                {Object.entries(item).map(([clave, valor]) => (
                  <ThemedText key={clave} style={[styles.filaDato, { color: colors.text }]}>
                    <ThemedText style={{ color: colors.textMuted, fontSize: 13 }}>
                      {clave.replace(/_/g, ' ')}:{' '}
                    </ThemedText>
                    {String(valor)}
                  </ThemedText>
                ))}
              </View>
            )}
          />
        </>
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
  spacingTop: {
    marginTop: Spacing.md,
  },
  panel: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: Spacing.sm,
  },
  filtros: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filaFechas: {
    flexDirection: 'row',
    gap: Spacing.sm,
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
  guardarBoton: {
    borderRadius: Radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  resumen: {
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  resumenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  resumenItem: {
    minWidth: 110,
  },
  resumenValor: {
    fontSize: 22,
    fontWeight: '700',
  },
  resumenLabel: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  row: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 4,
  },
  filaDato: {
    fontSize: 13,
    textTransform: 'capitalize',
  },
});
