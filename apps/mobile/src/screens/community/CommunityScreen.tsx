import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Colors } from '../../constants/colors';
import { apiClient } from '../../services/api';

interface Post {
  id: number;
  title: string | null;
  content: string;
  likesCount: number;
  commentsCount: number;
  isPublished: boolean;
  createdAt: string;
  author: { id: number; firstName: string | null; lastName: string | null; email: string | null };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} daq. oldin`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  return `${days} kun oldin`;
}

export function CommunityScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setError(null);
    try {
      const res = await apiClient.get<{ data: Post[] }>('/community/posts', { page: 1, limit: 20 });
      setPosts(res.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const onRefresh = () => { setRefreshing(true); fetchPosts(); };

  const getAuthorName = (author: Post['author']) =>
    author.firstName ? `${author.firstName} ${author.lastName || ''}`.trim() : author.email || 'Anonim';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Hamjamiyat</Text>
        <TouchableOpacity style={styles.newPost}>
          <Text style={styles.newPostText}>+ Yangi post</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchPosts}><Text style={styles.retryText}>Qayta urinish</Text></TouchableOpacity>
        </View>
      ) : posts.length === 0 ? (
        <Text style={styles.emptyText}>Hozircha postlar yo'q</Text>
      ) : (
        posts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getAuthorName(post.author)[0]}</Text>
              </View>
              <View>
                <Text style={styles.postAuthor}>{getAuthorName(post.author)}</Text>
                <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
              </View>
            </View>
            {post.title && <Text style={styles.postTitle}>{post.title}</Text>}
            <Text style={styles.postText}>{post.content}</Text>
            <View style={styles.postActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>❤️ {post.likesCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>💬 {post.commentsCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>📢 Shikoyat</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.light.text },
  newPost: { backgroundColor: Colors.light.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  newPostText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  postCard: { backgroundColor: Colors.light.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.light.border },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.light.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: '600', color: Colors.light.primary },
  postAuthor: { fontSize: 15, fontWeight: '600', color: Colors.light.text },
  postTime: { fontSize: 12, color: Colors.light.textSecondary },
  postTitle: { fontSize: 16, fontWeight: '600', color: Colors.light.text, marginBottom: 4 },
  postText: { fontSize: 15, color: Colors.light.text, lineHeight: 22 },
  postActions: { flexDirection: 'row', marginTop: 12, gap: 16 },
  actionButton: {},
  actionText: { fontSize: 13, color: Colors.light.textSecondary },
  errorContainer: { alignItems: 'center', marginTop: 40 },
  errorText: { fontSize: 15, color: Colors.light.error, marginBottom: 12 },
  retryText: { fontSize: 15, color: Colors.light.primary, fontWeight: '600' },
  emptyText: { fontSize: 15, color: Colors.light.textSecondary, textAlign: 'center', marginTop: 40 },
});
