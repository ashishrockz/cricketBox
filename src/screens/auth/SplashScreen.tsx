import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthContext } from '../../context/AuthContext';
import { Colors, FontSize, FontWeight } from '../../theme';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const { isAuthenticated, isLoading } = useAuthContext();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigation.replace('Onboarding');
      }
      // If authenticated, AppNavigator already handles redirect to Main
    }
  }, [isLoading, isAuthenticated]);

  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <View style={styles.logo}>
          <Text style={styles.logoIcon}>🏏</Text>
        </View>
        <Text style={styles.name}>{t('common.appName')}</Text>
        <Text style={styles.tagline}>{t('auth.splash.tagline')}</Text>
      </View>
      <ActivityIndicator color={Colors.accent} size="small" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoIcon: {
    fontSize: 48,
  },
  name: {
    fontSize: 34,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  loader: {
    position: 'absolute',
    bottom: 60,
  },
});
