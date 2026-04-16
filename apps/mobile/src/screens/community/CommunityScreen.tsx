import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import type { AppPalette } from '../../constants/colors';
import { useAppPalette } from '../../theme/useAppPalette';
import { communityService, type CommunityComment, type CommunityPost } from '../../services/community';

export function CommunityScreen() {
  const C = useAppPalette();
  const styles = useMemo(() => buildCommunityStyles(C), [C]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newPost, setNewPost] = useState('');
  const [sendingPost, setSendingPost] = useState(false);

  const [activePost, setActivePost] = useState<CommunityPost | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const hasMore = useMemo(() => posts.length < total, [posts.length, total]);

  const load = useCallback(
    async (opts?: { reset?: boolean; nextPage?: number; silent?: boolean }) => {
      const reset = !!opts?.reset;
      const nextPage = opts?.nextPage ?? (reset ? 1 : page);
      if (!opts?.silent) setError(null);

      try {
        if (reset) setLoading(true);
        const res = await communityService.listPosts({ page: nextPage, limit: 20, isPublished: true });
        setTotal(res.total);
        setPage(res.page);
        setPosts((prev) => (reset ? res.data : [...prev, ...res.data]));
      } catch (e: any) {
        setError(e?.message || 'Yuklab bo‘lmadi');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [page],
  );

  useEffect(() => {
    load({ reset: true });
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load({ reset: true, silent: true });
  };

  const onEndReached = () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    load({ nextPage: page + 1 });
  };

  const submitPost = async () => {
    const content = newPost.trim();
    if (!content || sendingPost) return;
    setSendingPost(true);
    setError(null);
    const optimistic: CommunityPost = {
      id: -Date.now(),
      title: null,
      content,
      imageUrl: null,
      likesCount: 0,
      commentsCount: 0,
      isPublished: true,
      isFlagged: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: { id: 0, email: null, firstName: null, lastName: null },
      isLiked: false,
    };
    setPosts((prev) => [optimistic, ...prev]);
    setNewPost('');
    try {
      const created = await communityService.createPost({ content });
      setPosts((prev) => prev.map((p) => (p.id === optimistic.id ? created : p)));
      setTotal((t) => t + 1);
    } catch (e: any) {
      setPosts((prev) => prev.filter((p) => p.id !== optimistic.id));
      setNewPost(content);
      setError(e?.message || 'Yuborib bo‘lmadi');
    } finally {
      setSendingPost(false);
    }
  };

  const toggleLike = async (postId: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likesCount: p.likesCount + (p.isLiked ? -1 : 1) }
          : p,
      ),
    );
    try {
      const res = await communityService.toggleLike(postId);
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likesCount: res.likesCount, isLiked: res.isLiked } : p)));
    } catch {
      // rollback: reload silently
      load({ reset: true, silent: true });
    }
  };

  const openComments = async (post: CommunityPost) => {
    setActivePost(post);
    setCommentsOpen(true);
    setComments([]);
    setNewComment('');
    setCommentsLoading(true);
    try {
      const res = await communityService.getComments(post.id);
      setComments(res);
    } catch (e: any) {
      setError(e?.message || 'Izohlarni yuklab bo‘lmadi');
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async () => {
    const content = newComment.trim();
    if (!activePost || !content || sendingComment) return;
    setSendingComment(true);
    try {
      const created = await communityService.addComment(activePost.id, { content });
      setComments((prev) => [...prev, created]);
      setNewComment('');
      setPosts((prev) => prev.map((p) => (p.id === activePost.id ? { ...p, commentsCount: p.commentsCount + 1 } : p)));
    } catch (e: any) {
      setError(e?.message || 'Izoh yuborilmadi');
    } finally {
      setSendingComment(false);
    }
  };

  const reportPost = async (postId: number) => {
    try {
      await communityService.reportPost(postId, { reason: 'Noto‘g‘ri kontent' });
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isFlagged: true } : p)));
    } catch (e: any) {
      setError(e?.message || 'Shikoyat yuborilmadi');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Hamjamiyat</Text>
          <Text style={styles.subtitle}>Tajribalaringizni ulashing</Text>
        </View>

        <View style={[styles.forumHint, { backgroundColor: C.primaryLight, borderColor: C.border }]}>
          <Text style={[styles.forumHintText, { color: C.textSecondary }]}>
            Kengaytirilgan forum va anonim savol-javob rejimi tez orada. Hozirgi postlar moderatsiya qilinadi.
          </Text>
        </View>

        {/* New Post */}
        <View style={styles.newPost}>
          <TextInput
            style={styles.postInput}
            placeholder="Bugun nimani his qildingiz? Ulashing..."
            placeholderTextColor={C.textMuted}
            multiline
            value={newPost}
            onChangeText={setNewPost}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!newPost.trim() || sendingPost) && { opacity: 0.4 }]}
            onPress={submitPost}
            disabled={!newPost.trim() || sendingPost}
          >
            {sendingPost ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Yuborish</Text>}
          </TouchableOpacity>
        </View>

        {/* Posts */}
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={C.primary} />
            <Text style={styles.stateText}>Yuklanmoqda...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={[styles.stateText, { color: C.error }]}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => load({ reset: true })}>
              <Text style={styles.retryText}>Qayta urinish</Text>
            </TouchableOpacity>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>Hozircha postlar yo‘q</Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            renderItem={({ item: post }) => (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.authorAvatar}>
                    <Text style={{ fontSize: 18 }}>🧠</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.author}>
                      {(post.author?.firstName || post.author?.lastName)
                        ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim()
                        : post.author?.email || 'Foydalanuvchi'}
                    </Text>
                    <Text style={styles.time}>{new Date(post.createdAt).toLocaleString()}</Text>
                  </View>
                  {post.isFlagged ? <Text style={styles.flag}>⚑</Text> : null}
                </View>
                {post.title ? <Text style={styles.postTitle}>{post.title}</Text> : null}
                <Text style={styles.content}>{post.content}</Text>
                <View style={styles.cardBottom}>
                  <TouchableOpacity style={styles.likeBtn} onPress={() => toggleLike(post.id)}>
                    <Text style={styles.likeIcon}>{post.isLiked ? '❤️' : '🤍'}</Text>
                    <Text style={[styles.likeCount, post.isLiked && { color: '#ef4444' }]}>{post.likesCount}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openComments(post)}>
                    <Text style={styles.replyBtn}>💬 Izoh ({post.commentsCount})</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => reportPost(post.id)}>
                    <Text style={styles.reportBtn}>🚩 Shikoyat</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListFooterComponent={
              loadingMore ? (
                <View style={{ paddingVertical: 16 }}>
                  <ActivityIndicator color={C.primary} />
                </View>
              ) : null
            }
          />
        )}

        <Modal visible={commentsOpen} animationType="slide" onRequestClose={() => setCommentsOpen(false)}>
          <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Izohlar</Text>
              <TouchableOpacity onPress={() => setCommentsOpen(false)}>
                <Text style={styles.modalClose}>Yopish</Text>
              </TouchableOpacity>
            </View>
            {commentsLoading ? (
              <View style={styles.stateBox}>
                <ActivityIndicator color={C.primary} />
                <Text style={styles.stateText}>Yuklanmoqda...</Text>
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(c) => String(c.id)}
                contentContainerStyle={{ padding: 16, gap: 10 }}
                renderItem={({ item }) => (
                  <View style={styles.commentCard}>
                    <Text style={styles.commentAuthor}>
                      {(item.author?.firstName || item.author?.lastName)
                        ? `${item.author.firstName || ''} ${item.author.lastName || ''}`.trim()
                        : item.author?.email || 'Foydalanuvchi'}
                    </Text>
                    <Text style={styles.commentText}>{item.content}</Text>
                    <Text style={styles.commentTime}>{new Date(item.createdAt).toLocaleString()}</Text>
                  </View>
                )}
              />
            )}
            <View style={styles.commentComposer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Izoh yozing..."
                placeholderTextColor={C.textMuted}
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity
                style={[styles.commentSendBtn, (!newComment.trim() || sendingComment) && { opacity: 0.4 }]}
                onPress={submitComment}
                disabled={!newComment.trim() || sendingComment}
              >
                {sendingComment ? <ActivityIndicator color="#fff" /> : <Text style={styles.commentSendText}>Yuborish</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

function buildCommunityStyles(C: AppPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: { padding: 24, paddingTop: 16 },
    title: { fontSize: 26, fontWeight: '700', color: C.text },
    subtitle: { fontSize: 13, color: C.textSecondary, marginTop: 4 },
    forumHint: { marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
    forumHintText: { fontSize: 12, lineHeight: 17 },
    newPost: {
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: C.surface,
      borderRadius: 16,
      padding: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    postInput: { fontSize: 14, color: C.text, minHeight: 60, textAlignVertical: 'top', marginBottom: 10 },
    sendBtn: { alignSelf: 'flex-end', backgroundColor: C.primary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 },
    sendText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    list: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
    card: {
      backgroundColor: C.surface,
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
    authorAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    author: { fontSize: 14, fontWeight: '700', color: C.text },
    time: { fontSize: 11, color: C.textMuted },
    postTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 6 },
    content: { fontSize: 14, color: C.text, lineHeight: 21, marginBottom: 12 },
    cardBottom: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    likeIcon: { fontSize: 16 },
    likeCount: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
    replyBtn: { fontSize: 13, color: C.textSecondary, fontWeight: '500' },
    reportBtn: { fontSize: 13, color: C.textSecondary, fontWeight: '500' },
    flag: { fontSize: 14, color: C.warning },
    stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
    stateText: { color: C.textSecondary, fontSize: 14, textAlign: 'center' },
    retryBtn: { marginTop: 8, backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    retryText: { color: '#fff', fontWeight: '700' },
    modalHeader: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalTitle: { fontSize: 16, fontWeight: '800', color: C.text },
    modalClose: { color: C.primary, fontWeight: '700' },
    commentCard: { backgroundColor: C.surface, borderRadius: 14, padding: 12 },
    commentAuthor: { fontSize: 12, fontWeight: '800', color: C.text },
    commentText: { marginTop: 6, color: C.text, fontSize: 13, lineHeight: 18 },
    commentTime: { marginTop: 8, color: C.textMuted, fontSize: 11 },
    commentComposer: {
      borderTopWidth: 1,
      borderTopColor: C.border,
      padding: 12,
      flexDirection: 'row',
      gap: 10,
      backgroundColor: C.background,
    },
    commentInput: {
      flex: 1,
      backgroundColor: C.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: C.text,
    },
    commentSendBtn: { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' },
    commentSendText: { color: '#fff', fontWeight: '800' },
  });
}
