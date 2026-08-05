import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Tono = 'success' | 'warning' | 'danger' | 'neutral';

const EXITO = new Set(['ACTIVO', 'ACTIVA', 'VERIFICADO', 'COMPLETADO', 'PROGRAMADA']);
const ADVERTENCIA = new Set(['PENDIENTE', 'VENCIDA', 'SUSPENDIDA', 'PROCESANDO']);
const PELIGRO = new Set(['RECHAZADO', 'ANULADO', 'ANULADA', 'CANCELADA', 'ERROR']);

function tonoDeEstado(estado: string): Tono {
  const normalizado = estado.toUpperCase();
  if (EXITO.has(normalizado)) return 'success';
  if (ADVERTENCIA.has(normalizado)) return 'warning';
  if (PELIGRO.has(normalizado)) return 'danger';
  return 'neutral';
}

// Pill de estado con color semántico (no una convención propia: reutiliza
// los mismos tonos success/warning/danger que el resto de la app). Cubre
// todos los estados usados en el proyecto (socios, membresías, pagos,
// reservas, sesiones, consultas nutricionales) mapeándolos a un tono común.
export function Badge({ estado, label }: { estado: string; label?: string }) {
  const colorScheme = useColorScheme() ?? 'light';
  const tono = tonoDeEstado(estado);
  const colores = Colors[colorScheme];

  const fondo = {
    success: colores.successMuted,
    warning: colores.warningMuted,
    danger: colores.dangerMuted,
    neutral: colores.surfaceAlt,
  }[tono];

  const texto = {
    success: colores.success,
    warning: colores.warning,
    danger: colores.danger,
    neutral: colores.textMuted,
  }[tono];

  return (
    <View style={[styles.badge, { backgroundColor: fondo }]}>
      <ThemedText style={[styles.texto, { color: texto }]}>
        {label ?? estado}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  texto: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});
