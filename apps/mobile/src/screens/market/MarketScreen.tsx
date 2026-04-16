import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { useNetwork } from '../../providers/NetworkProvider';
import {
  monetizationService,
  type ConsumerPlan,
  type Entitlements,
  type PaymentRow,
} from '../../services/monetization';

export function MarketScreen() {
  const qc = useQueryClient();
  const { isOnline } = useNetwork();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void qc.invalidateQueries({ queryKey: ['entitlements'] });
      void qc.invalidateQueries({ queryKey: ['my-payments'] });
    }, [qc]),
  );

  useEffect(() => {
    const sub = Linking.addEventListener('url', (ev) => {
      if (ev.url.includes('payment-return')) {
        void qc.invalidateQueries({ queryKey: ['entitlements'] });
        void qc.invalidateQueries({ queryKey: ['my-payments'] });
      }
    });
    return () => sub.remove();
  }, [qc]);

  const plansQ = useQuery({
    queryKey: ['consumer-plans'],
    queryFn: () => monetizationService.listPlans(),
  });

  const entQ = useQuery({
    queryKey: ['entitlements'],
    queryFn: () => monetizationService.getEntitlements(),
  });

  const paymentsQ = useQuery({
    queryKey: ['my-payments'],
    queryFn: () => monetizationService.listMyPayments(),
  });

  const confirmMut = useMutation({
    mutationFn: (paymentId: number) => monetizationService.confirmPremiumPayment(paymentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entitlements'] });
      qc.invalidateQueries({ queryKey: ['my-payments'] });
      Alert.alert('Muvaffaqiyat', 'Premium faollashtirildi.');
    },
    onError: (e: unknown) => Alert.alert('Xatolik', e instanceof Error ? e.message : 'Tasdiqlashda xato'),
  });

  const startMut = useMutation({
    mutationFn: () => monetizationService.startPremium(),
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ['entitlements'] });
      await qc.invalidateQueries({ queryKey: ['my-payments'] });

      if (data.checkoutUrl) {
        const can = await Linking.canOpenURL(data.checkoutUrl);
        if (can) {
          await Linking.openURL(data.checkoutUrl);
        }
        Alert.alert(
          'CLICK to‘lovi',
          `To‘lov: ${data.amount.toLocaleString('uz-UZ')} so‘m. CLICK ilovasida to‘lovni yakunlang, so‘ng «Holatni yangilash» ni bosing.`,
          [
            {
              text: 'Holatni yangilash',
              onPress: () => {
                void qc.invalidateQueries({ queryKey: ['entitlements'] });
                void qc.invalidateQueries({ queryKey: ['my-payments'] });
              },
            },
            { text: 'Yopish', style: 'cancel' },
          ],
        );
        return;
      }

      Alert.alert(
        'To‘lov yaratildi',
        `ID: ${data.payment.id}. Summasi: ${data.amount} so‘m. CLICK sozlanmaganda — test muhitida «Qo‘lda tasdiqlash» (faqat dev/staging).`,
        [
          {
            text: 'Qo‘lda tasdiqlash',
            onPress: () => confirmMut.mutate(data.payment.id),
          },
          { text: 'Keyinroq', style: 'cancel' },
        ],
      );
    },
    onError: (e: unknown) => Alert.alert('Xatolik', e instanceof Error ? e.message : 'Boshlashda xato'),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['consumer-plans'] }),
      qc.invalidateQueries({ queryKey: ['entitlements'] }),
      qc.invalidateQueries({ queryKey: ['my-payments'] }),
    ]);
    setRefreshing(false);
  }, [qc]);

  const loading = plansQ.isLoading || entQ.isLoading;
  const err = plansQ.error || entQ.error;
  const plans = plansQ.data || [];
  const ent: Entitlements | undefined = entQ.data;
  const payments: PaymentRow[] = paymentsQ.data || [];

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
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
        <Text style={styles.title}>Market</Text>
        <Text style={styles.subtitle}>Obuna rejalar va to‘lovlar (backend)</Text>
      </View>

      {err ? (
        <Text style={styles.warn}>
          {!isOnline ? 'Internet yo‘q. ' : ''}
          {err instanceof Error ? err.message : 'Yuklashda xato'}
        </Text>
      ) : null}

      {ent ? (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>
            {ent.isPremium ? '⭐ Premium faol' : '🌱 Standart'}
          </Text>
          <Text style={styles.bannerSub}>
            Reja: {ent.planCode}
            {ent.premiumUntil ? ` · ${new Date(ent.premiumUntil).toLocaleDateString('uz-UZ')}` : ''}
          </Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Mavjud rejalar</Text>
      {plans.length === 0 ? (
        <Text style={styles.empty}>Rejalar hozircha yo‘q. Superadmin panelida consumer plan yarating.</Text>
      ) : (
        plans.map((p: ConsumerPlan) => (
          <View key={p.id} style={styles.card}>
            <Text style={styles.planName}>{p.name}</Text>
            <Text style={styles.planCode}>{p.code}</Text>
            {p.description ? <Text style={styles.desc}>{p.description}</Text> : null}
            <Text style={styles.price}>{p.monthlyPriceUzs?.toLocaleString?.() || 0} so‘m / oy</Text>
            {p.code === 'PREMIUM' && p.isActive ? (
              <TouchableOpacity
                style={[styles.buyBtn, startMut.isPending && { opacity: 0.7 }]}
                disabled={startMut.isPending || ent?.isPremium}
                onPress={() => {
                  if (ent?.isPremium) {
                    Alert.alert('Premium', 'Sizda allaqachon premium faol.');
                    return;
                  }
                  startMut.mutate();
                }}
              >
                <Text style={styles.buyText}>{ent?.isPremium ? 'Premium faol' : 'Premium boshlash'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>So‘nggi to‘lovlar</Text>
      {payments.length === 0 ? (
        <Text style={styles.empty}>To‘lovlar yo‘q</Text>
      ) : (
        payments.map((pay) => (
          <View key={pay.id} style={styles.payRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.payDesc}>{pay.description || pay.kind}</Text>
              <Text style={styles.payMeta}>
                {new Date(pay.createdAt).toLocaleString('uz-UZ')} · {pay.status}
              </Text>
            </View>
            <Text style={styles.payAmt}>{pay.amount?.toLocaleString?.()} {pay.currency}</Text>
            {pay.status === 'PENDING' && pay.kind === 'MOBILE_PREMIUM' ? (
              <TouchableOpacity
                style={styles.smallBtn}
                onPress={async () => {
                  try {
                    const st = await monetizationService.getPremiumPaymentStatus(pay.id);
                    await qc.invalidateQueries({ queryKey: ['entitlements'] });
                    await qc.invalidateQueries({ queryKey: ['my-payments'] });
                    if (st.payment.status === 'COMPLETED' || st.isPremium) {
                      Alert.alert('Tayyor', 'Premium faollashtirildi.');
                    } else {
                      Alert.alert(
                        'Kutilmoqda',
                        'To‘lov hali tasdiqlanmadi. CLICK bilan to‘laganingizdan keyin qayta urinib ko‘ring.',
                      );
                    }
                  } catch (e: unknown) {
                    Alert.alert('Xatolik', e instanceof Error ? e.message : 'So‘rov xato');
                  }
                }}
              >
                <Text style={styles.smallBtnText}>Holat</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, paddingTop: 16 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  warn: { marginHorizontal: 16, color: Colors.error, marginBottom: 8 },
  banner: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bannerTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  bannerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginHorizontal: 16, marginBottom: 12 },
  empty: { marginHorizontal: 16, color: Colors.textMuted, marginBottom: 16 },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  planName: { fontSize: 17, fontWeight: '800', color: Colors.text },
  planCode: { fontSize: 12, color: Colors.primary, fontWeight: '700', marginTop: 4 },
  desc: { fontSize: 13, color: Colors.textSecondary, marginTop: 8 },
  price: { fontSize: 15, fontWeight: '700', color: Colors.text, marginTop: 10 },
  buyBtn: { marginTop: 12, backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  buyText: { color: '#fff', fontWeight: '800' },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    gap: 8,
  },
  payDesc: { fontSize: 14, fontWeight: '600', color: Colors.text },
  payMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  payAmt: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  smallBtn: { backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  smallBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
