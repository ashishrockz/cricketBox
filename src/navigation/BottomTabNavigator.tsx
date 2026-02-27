import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { TabParamList } from './types';
import { Colors, Spacing, Radius, FontSize } from '../theme';

import HomeScreen      from '../screens/main/HomeScreen';
import MyMatchesScreen from '../screens/main/MyMatchesScreen';
import CreateRoomScreen from '../screens/main/CreateRoomScreen';
import ToolsScreen     from '../screens/main/ToolsScreen';
import ProfileScreen   from '../screens/main/ProfileScreen';

// Inline icon component using text chars as fallback
import Ionicons from '@react-native-vector-icons/ionicons';

const Tab = createBottomTabNavigator<TabParamList>();

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const icons: Record<string, [string, string]> = {
    Home:    ['home',          'home-outline'],
    Matches: ['baseball',      'baseball-outline'],
    Create:  ['add-circle',    'add-circle-outline'],
    Tools:   ['calculator',    'calculator-outline'],
    Profile: ['person-circle', 'person-circle-outline'],
  };

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const [active, inactive] = icons[route.name] ?? ['apps', 'apps-outline'];
        const isCreate = route.name === 'Create';

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name as any);
        };

        if (isCreate) {
          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={styles.fabWrap} activeOpacity={0.85}>
              <View style={styles.fab}>
                <Ionicons name="add" size={28} color={Colors.white} />
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity key={route.key} onPress={onPress} style={styles.tab} activeOpacity={0.7}>
            <Ionicons
              name={isFocused ? active : inactive}
              size={24}
              color={isFocused ? Colors.accent : Colors.textMuted}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"    component={HomeScreen} />
      <Tab.Screen name="Matches" component={MyMatchesScreen} />
      <Tab.Screen name="Create"  component={CreateRoomScreen} />
      <Tab.Screen name="Tools"   component={ToolsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: Spacing.sm,
  },
  fabWrap: {
    flex: 1,
    alignItems: 'center',
    marginTop: -20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.surface,
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
