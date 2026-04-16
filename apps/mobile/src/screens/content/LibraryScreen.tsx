import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Dimensions,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { Colors } from '../../constants/colors';
import { contentService, Article, AudioContent, VideoContent } from '../../services/content';
import { resolveMediaUrl } from '../../config';
import { ScreenStates } from '../../components/ScreenStates';

const { width } = Dimensions.get('window');

export function LibraryScreen({ navigation }: any) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [audios, setAudios] = useState<AudioContent[]>([]);
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadError(null);
    try {
      const [art, aud, vid] = await Promise.all([
        contentService.getArticles(),
        contentService.getAudio(),
        contentService.getVideos(),
      ]);
      setArticles(art?.data || []);
      setAudios(aud?.data || []);
      setVideos(vid?.data || []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Yuklashda xato');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (loadError && !articles.length && !audios.length && !videos.length) {
    return (
      <View style={styles.container}>
        <ScreenStates error={loadError} onRetry={loadData} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Ruhiyat Kutubxonasi</Text>
        <Text style={styles.subtitle}>Psixologik salomatlik uchun eng sara manbalar</Text>
      </View>

      {/* Main Categories */}
      <View style={styles.grid}>
        {/* Podcasts Card */}
        <TouchableOpacity style={styles.mainCard} onPress={() => navigation.navigate('AudioLessons')}>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Audio darslar</Text>
            <Text style={styles.cardSubtitle}>{audios.length || 0} ta podkast va audio</Text>
          </View>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=300' }} 
            style={styles.cardImgLarge} 
          />
          <View style={styles.playIconContainer}>
            <Text style={styles.playIcon}>🎧</Text>
          </View>
        </TouchableOpacity>

        {/* Small Cards Column */}
        <View style={styles.sideColumn}>
          {/* Videos */}
          <TouchableOpacity
            style={[styles.smallCard, { backgroundColor: '#f8fafc' }]}
            onPress={() => navigation.navigate('VideoLessons')}
          >
            <Text style={styles.smallCardTitle}>Videolar</Text>
            <View style={styles.videoPlaceholder}>
               <View style={styles.videoPlayBtn}><Text style={{color: '#fff'}}>▶️</Text></View>
            </View>
            <Text style={styles.countText}>{videos.length} ta dars</Text>
          </TouchableOpacity>

          {/* Articles */}
          <TouchableOpacity
            style={[styles.smallCard, { backgroundColor: '#f8fafc', marginTop: 12 }]}
            onPress={() => navigation.navigate('Articles')}
            activeOpacity={0.9}
          >
            <Text style={styles.smallCardTitle}>Maqolalar</Text>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200' }} 
              style={styles.bookImg} 
            />
             <Text style={styles.countText}>{articles.length} ta maqola</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Featured Articles Section */}
      <Text style={styles.sectionTitle}>Siz uchun tanlangan maqolalar</Text>
      <View style={styles.articleList}>
        {articles.slice(0, 5).map(article => (
          <TouchableOpacity
            key={article.id}
            style={styles.articleItem}
            onPress={() => navigation.navigate('ArticleDetail', { id: article.id, title: article.title })}
            activeOpacity={0.9}
          >
            <Image source={{ uri: resolveMediaUrl(article.coverImageUrl) || 'https://images.unsplash.com/photo-1493839523149-2864fca44919?w=200' }} style={styles.artThumb} />
            <View style={styles.artContent}>
               <Text style={styles.artTitle} numberOfLines={2}>{article.title}</Text>
               <Text style={styles.artMeta}>{new Date(article.createdAt).toLocaleDateString()} • Psixologiya</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Psychology Services */}
      <Text style={styles.sectionTitle}>Professional Xizmatlar</Text>
      <View style={styles.servicesRow}>
        <TouchableOpacity style={[styles.serviceItem, { backgroundColor: '#4f46e5' }]} onPress={() => navigation.navigate('Videochat')}>
          <Text style={styles.serviceText}>Video Konsultatsiya</Text>
          <Text style={styles.serviceEmoji}>📹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.serviceItem, { backgroundColor: '#10b981' }]} onPress={() => navigation.navigate('Diary')}>
          <Text style={styles.serviceText}>O'z-o'zini tahlil (Diary)</Text>
          <Text style={styles.serviceEmoji}>🖊️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.serviceItem, { backgroundColor: '#f1f5f9' }]} onPress={() => navigation.navigate('Tests')}>
          <Text style={[styles.serviceText, { color: Colors.text }]}>Psixologik Testlar</Text>
          <Text style={styles.serviceEmoji}>🧠</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.serviceItem, { backgroundColor: '#f1f5f9' }]}
          onPress={() => navigation.navigate('Messages')}
        >
          <Text style={[styles.serviceText, { color: Colors.text }]}>Mutaxassis bilan chat</Text>
          <Text style={styles.serviceEmoji}>💬</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  
  grid: { flexDirection: 'row', paddingHorizontal: 20, gap: 12 },
  mainCard: { 
    flex: 1, 
    height: 280, 
    borderRadius: 24, 
    backgroundColor: '#f8fafc', 
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  cardText: { zIndex: 1 },
  cardTitle: { fontSize: 19, fontWeight: '800', color: Colors.text },
  cardSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  cardImgLarge: { 
    position: 'absolute', 
    bottom: -10, 
    right: -10, 
    width: 140, height: 140, 
    borderRadius: 70,
    opacity: 0.15
  },
  playIconContainer: { 
    position: 'absolute', 
    bottom: 20, right: 20, 
    width: 44, height: 44, 
    borderRadius: 22, 
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  playIcon: { fontSize: 20 },

  sideColumn: { flex: 0.8 },
  smallCard: { flex: 1, borderRadius: 24, padding: 16, overflow: 'hidden', justifyContent: 'space-between', borderWidth: 1, borderColor: '#f1f5f9' },
  smallCardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  videoPlaceholder: { 
    width: '100%', height: 40, 
    backgroundColor: '#e2e8f0', 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginVertical: 4
  },
  videoPlayBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  bookImg: { width: '60%', height: 40, alignSelf: 'flex-end', borderRadius: 4, opacity: 0.1 },
  countText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },

  sectionTitle: { fontSize: 19, fontWeight: '800', color: Colors.text, marginHorizontal: 20, marginTop: 30, marginBottom: 15 },
  
  articleList: { paddingHorizontal: 20, gap: 15 },
  articleItem: { flexDirection: 'row', gap: 15, alignItems: 'center' },
  artThumb: { width: 70, height: 70, borderRadius: 16 },
  artContent: { flex: 1 },
  artTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  artMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },

  servicesRow: { flexDirection: 'row', paddingHorizontal: 20, flexWrap: 'wrap', gap: 10 },
  serviceItem: { width: '48%', height: 90, borderRadius: 22, padding: 16, justifyContent: 'space-between', borderWidth: 1, borderColor: '#f1f5f9' },
  serviceText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  serviceEmoji: { fontSize: 26, alignSelf: 'flex-end', opacity: 0.5 },
});
