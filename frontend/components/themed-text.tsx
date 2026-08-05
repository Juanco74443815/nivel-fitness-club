import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 15,
    lineHeight: 21,
  },
  defaultSemiBold: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  link: {
    lineHeight: 22,
    fontSize: 15,
    color: '#0B4F9E',
    fontWeight: '600',
  },
});
