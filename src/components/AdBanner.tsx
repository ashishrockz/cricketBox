import React, { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useAds } from '../hooks/useAds';
import type { AdPlacement } from '../types';
import { Colors, Spacing, Radius, FontSize } from '../theme';

interface AdBannerProps {
  placement: AdPlacement;
}

export default function AdBanner({ placement }: AdBannerProps) {
  const { ads, fetchAds, recordClick } = useAds();

  useEffect(() => { fetchAds(placement); }, [placement]);

  if (!ads.length) return null;

  const ad = ads[0];

  const handlePress = () => {
    recordClick(ad._id);
    if (ad.ctaUrl) Linking.openURL(ad.ctaUrl).catch(() => {});
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={styles.container}>
      {ad.media.imageUrl ? (
        <Image source={{ uri: ad.media.imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.textAd}>
          <Text style={styles.adLabel}>AD</Text>
          <Text style={styles.title} numberOfLines={1}>{ad.title}</Text>
          {ad.description ? (
            <Text style={styles.desc} numberOfLines={1}>{ad.description}</Text>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  image: {
    width: '100%',
    height: 60,
  },
  textAd: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  adLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    backgroundColor: Colors.cardBorder,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  title: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '600',
  },
  desc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
