import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, FlatList, ListRenderItemInfo, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../navigation/types';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

const SLIDE_KEYS = ['1', '2', '3'];
const SLIDE_EMOJIS = ['🏏', '📊', '🏆'];

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const ref = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { t } = useTranslation();

  const slides = [
    { id: '1', emoji: SLIDE_EMOJIS[0], title: t('auth.onboarding.slide1Title'), desc: t('auth.onboarding.slide1Desc') },
    { id: '2', emoji: SLIDE_EMOJIS[1], title: t('auth.onboarding.slide2Title'), desc: t('auth.onboarding.slide2Desc') },
    { id: '3', emoji: SLIDE_EMOJIS[2], title: t('auth.onboarding.slide3Title'), desc: t('auth.onboarding.slide3Desc') },
  ];

  const next = () => {
    if (activeIndex < slides.length - 1) {
      const next = activeIndex + 1;
      ref.current?.scrollToIndex({ index: next });
      setActiveIndex(next);
    } else {
      navigation.replace('Login');
    }
  };

  const renderItem = ({ item }: ListRenderItemInfo<typeof slides[0]>) => (
    <View style={styles.slide}>
      <View style={styles.emojiWrap}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.desc}>{item.desc}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
      <TouchableOpacity
        onPress={() => navigation.replace('Login')}
        style={[styles.skipBtn, { top: insets.top + 16 }]}
      >
        <Text style={styles.skipText}>{t('auth.onboarding.skip')}</Text>
      </TouchableOpacity>

      <FlatList
        ref={ref}
        data={slides}
        renderItem={renderItem}
        keyExtractor={(i) => i.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
      />

      <View style={styles.dots}>
        {SLIDE_KEYS.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity onPress={next} style={styles.btn} activeOpacity={0.85}>
        <Text style={styles.btnText}>
          {activeIndex === slides.length - 1 ? t('auth.onboarding.getStarted') : t('auth.onboarding.next')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  skipBtn: {
    position: 'absolute',
    right: Spacing.xl,
    zIndex: 10,
  },
  skipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  emojiWrap: {
    width: 120,
    height: 120,
    borderRadius: 36,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emoji: { fontSize: 60 },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  desc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.card,
  },
  dotActive: {
    backgroundColor: Colors.accent,
    width: 24,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: width - 64,
    alignItems: 'center',
  },
  btnText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
});
