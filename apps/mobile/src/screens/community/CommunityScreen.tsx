import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';

const posts = [
  { author: 'Aziza M.', time: '2 soat oldin', text: 'Bugun birinchi marta meditatsiya qildim. Juda yoqdi!', likes: 12, comments: 3 },
  { author: 'Bobur K.', time: '5 soat oldin', text: 'Nafas mashqlari haqiqatan ham stressni kamaytiradi. Hammaga tavsiya qilaman.', likes: 24, comments: 7 },
  { author: 'Dilnoza S.', time: '1 kun oldin', text: 'Psixolog bilan seans juda foydali bo\'ldi. Rahmat Ruhiyat jamoasi!', likes: 45, comments: 12 },
];

export function CommunityScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Hamjamiyat</Text>
        <TouchableOpacity style={styles.newPost}>
          <Text style={styles.newPostText}>+ Yangi post</Text>
        </TouchableOpacity>
      </View>

      {posts.map((post, i) => (
        <View key={i} style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{post.author[0]}</Text>
            </View>
            <View>
              <Text style={styles.postAuthor}>{post.author}</Text>
              <Text style={styles.postTime}>{post.time}</Text>
            </View>
          </View>
          <Text style={styles.postText}>{post.text}</Text>
          <View style={styles.postActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>❤️ {post.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>💬 {post.comments}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>📢 Shikoyat</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
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
  postText: { fontSize: 15, color: Colors.light.text, lineHeight: 22 },
  postActions: { flexDirection: 'row', marginTop: 12, gap: 16 },
  actionButton: {},
  actionText: { fontSize: 13, color: Colors.light.textSecondary },
});
