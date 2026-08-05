import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { usuario } = useSession();
  const esAdministrador = usuario?.rol === 'Administrador';
  const puedeGestionarSocios =
    usuario?.rol === 'Administrador' || usuario?.rol === 'Recepcionista';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheetHairline,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="socios"
        options={{
          title: 'Socios',
          href: puedeGestionarSocios ? undefined : null,
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.3.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="usuarios"
        options={{
          title: 'Usuarios',
          href: esAdministrador ? undefined : null,
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="clases"
        options={{
          title: 'Clases',
          href: esAdministrador ? undefined : null,
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Reservas',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="checkmark.circle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="planes-membresia"
        options={{
          title: 'Planes',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="doc.text.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="membresias"
        options={{
          title: 'Membresías',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="creditcard.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="pagos"
        options={{
          title: 'Pagos',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="dollarsign.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reportes"
        options={{
          title: 'Reportes',
          href: esAdministrador ? undefined : null,
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="panel"
        options={{
          title: 'Panel',
          href: esAdministrador ? undefined : null,
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="gauge" color={color} />,
        }}
      />
      <Tabs.Screen
        name="auditoria"
        options={{
          title: 'Auditoría',
          href: esAdministrador ? undefined : null,
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="list.bullet.rectangle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="nutricion"
        options={{
          title: 'Nutrición',
          href: usuario?.rol === 'Socio' ? undefined : null,
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="fork.knife" color={color} />,
        }}
      />
    </Tabs>
  );
}

const StyleSheetHairline = Platform.OS === 'web' ? 1 : StyleSheet.hairlineWidth;
