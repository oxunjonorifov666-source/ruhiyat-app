import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
  StatusBar,
  Dimensions,
  Animated,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppPalette } from '../../theme/useAppPalette';
import { useResolvedThemeMode } from '../../hooks/useResolvedThemeMode';
import { useAuth } from '../../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { profileMobileService, type DashboardStats, type DailyInsightPayload } from '../../services/profileMobile';
import { DailyAiInsightCard } from '../../components/home/DailyAiInsightCard';
import { contentService, Banner, Article, Training, VideoContent } from '../../services/content';
import { resolveMediaUrl } from '../../config';
import { useQueryClient } from '@tanstack/react-query';
import { wellnessService } from '../../services/wellness';
import { ScreenStates } from '../../components/ScreenStates';
import { ParticleBackground } from '../../components/ParticleBackground';

const { width } = Dimensions.get('window');

const moods = [
  { id: 'happy', emoji: '🤩', label: 'Baxtli', color: '#fbbf24' },
  { id: 'calm', emoji: '😇', label: 'Xotirjam', color: '#10b981' },
  { id: 'tired', emoji: '🥱', label: 'Charchagan', color: '#64748b' },
  { id: 'sad', emoji: '😔', label: 'Xafa', color: '#3b82f6' },
  { id: 'angry', emoji: '😠', label: 'G\'azabda', color: '#ef4444' },
];

type DashItem = {
  key: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  route: string;
  color: string;
};

const DASHBOARD_ITEMS: DashItem[] = [
  { key: 'tests', label: 'Psixologik testlar', icon: 'clipboard-text-outline', route: 'Tests', color: '#2563eb' },
  { key: 'trainings', label: 'Treninglar', icon: 'school-outline', route: 'Trainings', color: '#0d9488' },
  { key: 'videoLib', label: 'Videokutubxona', icon: 'play-circle-outline', route: 'VideoLessons', color: '#7c3aed' },
  { key: 'articles', label: 'Maqolalar', icon: 'book-open-variant', route: 'Articles', color: '#c026d3' },
  { key: 'vchat', label: 'Video maslahat', icon: 'video-outline', route: 'Videochat', color: '#4f46e5' },
  { key: 'diary', label: 'Kundalik', icon: 'notebook-outline', route: 'Diary', color: '#059669' },
  { key: 'audio', label: 'Audio darslar', icon: 'headphones', route: 'AudioLessons', color: '#ea580c' },
  { key: 'ai', label: 'AI Psixolog', icon: 'robot-outline', route: 'AiPsychologist', color: '#db2777' },
];

function PressScaleTile({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: object;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, friction: 6 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  };
  return (
    <TouchableOpacity activeOpacity={1} onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={style}>
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
    </TouchableOpacity>
  );
}

function SectionHeader({
  title,
  icon,
  onSeeAll,
  seeAllLabel = "Hammasi",
  C,
}: {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onSeeAll?: () => void;
  seeAllLabel?: string;
  C: ReturnType<typeof useAppPalette>;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <View style={[styles.sectionIconWrap, { backgroundColor: C.primaryLight }]}>
          <MaterialCommunityIcons name={icon} size={22} color={C.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: C.text, fontSize: C.font(19) }]}>{title}</Text>
      </View>
      {onSeeAll ? (
        <TouchableOpacity onPress={onSeeAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.seeAll, { color: C.primary }]}>{seeAllLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function HomeScreen({ navigation }: any) {
  const queryClient = useQueryClient();
  const C = useAppPalette();
  const resolvedMode = useResolvedThemeMode();
  const { user } = useAuth();
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [dailyInsight, setDailyInsight] = useState<DailyInsightPayload | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const moodAnims = useRef(moods.map(() => new Animated.Value(1))).current;

  const fetchData = useCallback(async () => {
    setLoadError(null);
    try {
      const [b, a, t, v] = await Promise.all([
        contentService.getBanners().catch(() => [] as Banner[]),
        contentService.getFeaturedArticles().catch(() => ({ data: [] as Article[] })),
        contentService.getTrainings().catch(() => [] as Training[]),
        contentService.getVideos().catch(() => ({ data: [] as VideoContent[] })),
      ]);
      setBanners(Array.isArray(b) ? b : []);
      setArticles(a?.data || []);
      setTrainings(Array.isArray(t) ? t : []);
      setVideos(v?.data || []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Ma’lumot yuklanmadi');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      profileMobileService
        .getStats()
        .then(setDashStats)
        .catch(() => setDashStats(null));
      setInsightLoading(true);
      profileMobileService
        .getDailyInsight()
        .then(setDailyInsight)
        .catch(() => setDailyInsight(null))
        .finally(() => setInsightLoading(false));
    }, []),
  );

  useEffect(() => {
    fetchData();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
      ]),
    ).start();
  }, [fetchData, pulseAnim]);

  const handleMoodSelect = (moodId: string, index: number) => {
    setSelectedMood(moodId);
    wellnessService
      .createMoodEntry(moodId)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ['mood-entries'] });
        void queryClient.invalidateQueries({ queryKey: ['mood-weekly'] });
      })
      .catch(() => {});

    Animated.spring(moodAnims[index], {
      toValue: 1.3,
      friction: 3,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(moodAnims[index], {
        toValue: 1.1,
        useNativeDriver: true,
      }).start();
    });

    moods.forEach((_, i) => {
      if (i !== index) {
        Animated.timing(moodAnims[i], { toValue: 1, duration: 200, useNativeDriver: true }).start();
      }
    });
  };

  const displayName =
    user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.phone || 'Foydalanuvchi' : 'Mehmon';
  const avatarUri = user?.avatarUrl ? resolveMediaUrl(user.avatarUrl) : '';
  const avatarSource = avatarUri
    ? { uri: avatarUri }
    : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1d4ed8&color=fff` };

  const particleColor =
    resolvedMode === 'dark' ? 'rgba(96,165,250,0.35)' : 'rgba(37,99,235,0.22)';

  if (loading && !banners.length && !articles.length && !trainings.length && !videos.length) {
    return (
      <View style={[styles.container, { justifyContent: 'center', backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (loadError && !banners.length && !articles.length && !trainings.length && !videos.length) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <ScreenStates error={loadError} onRetry={fetchData} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ParticleBackground color={particleColor} />
      <StatusBar barStyle={resolvedMode === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <View style={styles.userInfo}>
          <TouchableOpacity style={[styles.avatarContainer, { borderColor: C.border }]} onPress={() => navigation.navigate('ProfileSettings')}>
            <Image source={avatarSource} style={styles.avatar} />
          </TouchableOpacity>
          <View style={styles.userText}>
            <Text style={[styles.userName, { color: C.text }]}>{displayName}</Text>
            <Text style={[styles.userLevel, { color: C.textSecondary }]}>{user?.isPremium ? 'Premium a\'zo' : 'Psixologik salomatlik'}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: C.surface, borderColor: C.border, borderWidth: 1 }]}
            onPress={() => navigation.navigate('Sos')}
            accessibilityLabel="SOS"
          >
            <MaterialCommunityIcons name="lifebuoy" size={24} color="#dc2626" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: C.surface, borderColor: C.border, borderWidth: 1 }]}
            onPress={() => navigation.navigate('Notifications')}
            accessibilityLabel="Bildirishnomalar"
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color={C.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <DailyAiInsightCard data={dailyInsight} loading={insightLoading} C={C} />

      {dashStats != null && dashStats.days > 0 ? (
        <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
          <View
            style={[
              styles.streakRow,
              { backgroundColor: C.primaryLight, borderColor: C.border },
            ]}
          >
            <MaterialCommunityIcons name="fire" size={22} color="#ea580c" />
            <Text style={{ flex: 1, marginLeft: 10, color: C.text, fontWeight: '800', fontSize: C.font(14), lineHeight: C.font(20) }}>
              {dashStats.days} kun ketma-ket faollik — kayfiyat yoki kundalik bilan
            </Text>
          </View>
        </View>
      ) : null}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.moodSection, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.sectionTitleCenter, { color: C.text }]}>Bugun o'zingizni qanday his qilyapsiz?</Text>
          <View style={styles.moodGrid}>
            {moods.map((mood, index) => (
              <TouchableOpacity key={mood.id} onPress={() => handleMoodSelect(mood.id, index)} style={styles.moodItem}>
                <Animated.View style={{ transform: [{ scale: moodAnims[index] }] }}>
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                </Animated.View>
                <Text
                  style={[
                    styles.moodLabel,
                    { color: C.textSecondary },
                    selectedMood === mood.id && { color: mood.color, fontWeight: '800' },
                  ]}
                >
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Asosiy bo‘limlar — katta ikonkalar */}
        <SectionHeader title="Tezkor kirish" icon="view-dashboard-outline" C={C} />
        <View style={styles.dashGrid}>
          {DASHBOARD_ITEMS.map((item) => (
            <PressScaleTile
              key={item.key}
              style={styles.dashTileWrap}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={[styles.dashTile, { backgroundColor: C.surface, borderColor: C.border }]}>
                <View style={[styles.dashIconCircle, { backgroundColor: `${item.color}18` }]}>
                  <MaterialCommunityIcons name={item.icon} size={34} color={item.color} />
                </View>
                <Text style={[styles.dashLabel, { color: C.text }]} numberOfLines={2}>
                  {item.label}
                </Text>
              </View>
            </PressScaleTile>
          ))}
        </View>

        {/* Bannerlar */}
        {banners.length > 0 ? (
          <>
            <SectionHeader title="Bannerlar" icon="image-multiple-outline" C={C} />
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.bannerContainer}>
              {banners.map((banner) => (
                <TouchableOpacity
                  key={banner.id}
                  style={styles.bannerSlide}
                  activeOpacity={0.92}
                  onPress={() => {
                    if (banner.linkUrl) {
                      const u = banner.linkUrl.startsWith('http') ? banner.linkUrl : resolveMediaUrl(banner.linkUrl);
                      if (u) Linking.openURL(u).catch(() => {});
                    }
                  }}
                >
                  <ImageBackground
                    source={{ uri: resolveMediaUrl(banner.imageUrl) || undefined }}
                    style={styles.bannerImg}
                    imageStyle={{ borderRadius: 24 }}
                  >
                    <View style={styles.bannerOverlay}>
                      <Text style={styles.bannerTag}>BANNER</Text>
                      <Text style={styles.bannerTitle}>{banner.title}</Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        ) : null}

        {/* Treninglar */}
        <SectionHeader
          title="Treninglar"
          icon="school-outline"
          C={C}
          onSeeAll={() => navigation.navigate('Trainings')}
        />
        {trainings.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {trainings.slice(0, 12).map((tr) => (
              <PressScaleTile
                key={tr.id}
                style={styles.hCardWrap}
                onPress={() => {
                  const u = tr.videoUrl ? resolveMediaUrl(tr.videoUrl) : null;
                  if (u) Linking.openURL(u).catch(() => {});
                  else navigation.navigate('Trainings');
                }}
              >
                <View style={[styles.trainCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                  {tr.imageUrl ? (
                    <Image source={{ uri: resolveMediaUrl(tr.imageUrl) || undefined }} style={styles.trainThumb} />
                  ) : (
                    <View style={[styles.trainThumb, styles.trainThumbPh, { backgroundColor: C.primaryLight }]}>
                      <MaterialCommunityIcons name="school-outline" size={36} color={C.primary} />
                    </View>
                  )}
                  <Text style={[styles.hCardTitle, { color: C.text }]} numberOfLines={2}>
                    {tr.title}
                  </Text>
                  {tr.duration != null ? (
                    <Text style={[styles.hCardMeta, { color: C.textMuted }]}>{tr.duration} daq.</Text>
                  ) : null}
                </View>
              </PressScaleTile>
            ))}
          </ScrollView>
        ) : (
          <Text style={[styles.emptyHint, { color: C.textSecondary }]}>Hozircha trening yo‘q. Superadmin chop etgach ko‘rinadi.</Text>
        )}

        {/* Videokutubxona */}
        <SectionHeader
          title="Videokutubxona"
          icon="play-circle-outline"
          C={C}
          onSeeAll={() => navigation.navigate('VideoLessons')}
        />
        {videos.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {videos.slice(0, 12).map((vid) => (
              <PressScaleTile
                key={vid.id}
                style={styles.hCardWrap}
                onPress={() => {
                  const u = resolveMediaUrl(vid.fileUrl);
                  if (u) Linking.openURL(u).catch(() => {});
                }}
              >
                <View style={[styles.videoCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                  {vid.thumbnailUrl ? (
                    <Image source={{ uri: resolveMediaUrl(vid.thumbnailUrl) || undefined }} style={styles.videoThumb} />
                  ) : (
                    <View style={[styles.videoThumb, styles.trainThumbPh, { backgroundColor: C.primaryLight }]}>
                      <MaterialCommunityIcons name="play-circle" size={40} color={C.primary} />
                    </View>
                  )}
                  <Text style={[styles.hCardTitle, { color: C.text }]} numberOfLines={2}>
                    {vid.title}
                  </Text>
                  {vid.duration != null ? (
                    <Text style={[styles.hCardMeta, { color: C.textMuted }]}>
                      {Math.max(1, Math.round(vid.duration / 60))} daq.
                    </Text>
                  ) : null}
                </View>
              </PressScaleTile>
            ))}
          </ScrollView>
        ) : (
          <Text style={[styles.emptyHint, { color: C.textSecondary }]}>
            Videodarslar hozircha yo‘q. Superadmin qo‘shgach, bu yerda ko‘rinadi.
          </Text>
        )}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: C.primaryLight }]}>
              <MaterialCommunityIcons name="newspaper-variant-outline" size={22} color={C.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Siz uchun maqolalar</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Library')}>
            <Text style={[styles.seeAll, { color: C.primary }]}>Hammasi</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.articleScroll}>
          {articles.map((article) => (
            <TouchableOpacity
              key={article.id}
              style={[styles.articleCard, { backgroundColor: C.surface, borderColor: C.border }]}
              onPress={() => navigation.navigate('ArticleDetail', { id: article.id, title: article.title })}
              activeOpacity={0.9}
            >
              <Image
                source={{
                  uri: resolveMediaUrl(article.coverImageUrl) || 'https://images.unsplash.com/photo-1493839523149-2864fca44919?w=400',
                }}
                style={styles.articleImg}
              />
              <View style={styles.articleInfo}>
                <Text style={[styles.articleTitle, { color: C.text }]} numberOfLines={2}>
                  {article.title}
                </Text>
                <Text style={[styles.articleDate, { color: C.textMuted }]}>{new Date(article.createdAt).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Animated.View style={{ marginTop: 8, transform: [{ scale: pulseAnim }] }}>
          <PressScaleTile onPress={() => navigation.navigate('Breathing')} style={{ marginHorizontal: 20, marginTop: 8 }}>
            <View style={[styles.extraBanner, { backgroundColor: '#0ea5e9' }]}>
              <MaterialCommunityIcons name="weather-windy" size={28} color="#fff" />
              <Text style={styles.extraBannerText}>Nafas mashqlari — 2 daqiqada tinchlaning</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
            </View>
          </PressScaleTile>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  avatar: { width: '100%', height: '100%' },
  userText: { marginLeft: 12 },
  userName: { fontSize: 17, fontWeight: '800' },
  userLevel: { fontSize: 13 },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: { paddingBottom: 20 },

  moodSection: { paddingVertical: 20, borderRadius: 32, marginHorizontal: 20, marginTop: 10, borderWidth: 1 },
  sectionTitleCenter: { textAlign: 'center', fontSize: 16, fontWeight: '700', marginBottom: 20 },
  moodGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10 },
  moodItem: { alignItems: 'center', gap: 6 },
  moodEmoji: { fontSize: 32 },
  moodLabel: { fontSize: 11, fontWeight: '500' },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontWeight: '800' },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  seeAll: { fontSize: 14, fontWeight: '700' },

  dashGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 10,
    justifyContent: 'space-between',
  },
  dashTileWrap: { width: (width - 14 * 2 - 10) / 2, marginBottom: 4 },
  dashTile: {
    borderRadius: 20,
    padding: 14,
    minHeight: 118,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  dashIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashLabel: { fontSize: 13, fontWeight: '800', lineHeight: 18, marginTop: 8 },

  bannerContainer: { marginBottom: 8, height: 200 },
  bannerSlide: { width, paddingHorizontal: 20 },
  bannerImg: { width: '100%', height: '100%', justifyContent: 'flex-end' },
  bannerOverlay: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  bannerTag: { color: '#fbbf24', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  bannerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 4 },

  hScroll: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  hCardWrap: { width: 168 },
  trainCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 10,
  },
  trainThumb: { width: '100%', height: 100 },
  trainThumbPh: { alignItems: 'center', justifyContent: 'center' },
  videoCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', paddingBottom: 10 },
  videoThumb: { width: '100%', height: 100 },
  hCardTitle: { fontSize: 14, fontWeight: '800', marginTop: 8, paddingHorizontal: 10 },
  hCardMeta: { fontSize: 12, marginTop: 4, paddingHorizontal: 10 },

  emptyHint: { marginHorizontal: 20, marginBottom: 8, fontSize: 13, lineHeight: 18 },

  articleScroll: { paddingHorizontal: 20, gap: 15 },
  articleCard: { width: 220, borderRadius: 24, overflow: 'hidden', borderWidth: 1 },
  articleImg: { width: '100%', height: 130 },
  articleInfo: { padding: 15 },
  articleTitle: { fontSize: 15, fontWeight: '700', height: 44 },
  articleDate: { fontSize: 12, marginTop: 8 },

  extraBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 20,
  },
  extraBannerText: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '800' },
});
