import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColor } from '@/hooks/use-theme-color';

// Contenedor compartido por todas las pantallas bajo (tabs): centra el
// contenido y lo limita en ancho para que no se estire de borde a borde en
// escritorio, y usa el safe-area real del dispositivo en vez del valor fijo
// (paddingTop: 80) que tenía cada pantalla por separado.
export function Screen({
  children,
  wide = false,
  style,
}: {
  children: React.ReactNode;
  wide?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <View style={[styles.root, { backgroundColor }]}>
      <View
        style={[
          styles.content,
          { maxWidth: wide ? 980 : 720, paddingTop: Math.max(insets.top, 16) + 24 },
          style,
        ]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
