import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, FontSize, FontWeight } from '../theme';
import { useTranslation } from 'react-i18next';

const CHECK_URL  = 'https://cricket-backend-orkc.onrender.com';
const CHECK_MS   = 10000; // re-check every 10 s

function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);
  const mountedRef = useRef(true);

  const check = useCallback(() => {
    fetch(CHECK_URL, { method: 'HEAD' })
      .then(() => { if (mountedRef.current) setIsOnline(true); })
      .catch(() => { if (mountedRef.current) setIsOnline(false); });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    check();
    const id = setInterval(check, CHECK_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [check]);

  return isOnline;
}

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation();
  const slideAnim = useRef(new Animated.Value(-40)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOnline ? -40 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  return (
    <Animated.View
      style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}
      pointerEvents="none"
    >
      <Text style={styles.text}>{t('common.noInternet')}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: Colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  text: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
});
