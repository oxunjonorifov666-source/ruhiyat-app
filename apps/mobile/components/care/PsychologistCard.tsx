import { Image, Pressable, Text, View } from 'react-native';
import type { MobilePsychologistListItem } from '~/types/care';
import { resolvePublicAssetUrl } from '~/lib/publicAsset';

type Props = {
  psych: MobilePsychologistListItem;
  onPress: () => void;
};

export function PsychologistCard({ psych, onPress }: Props) {
  const name = [psych.firstName, psych.lastName].filter(Boolean).join(' ');
  const uri = resolvePublicAssetUrl(psych.avatarUrl);
  return (
    <Pressable
      onPress={onPress}
      className="flex-row rounded-3xl bg-white border border-calm-200 p-4 mb-3 gap-4 active:opacity-90"
      accessibilityRole="button"
    >
      <View className="w-16 h-16 rounded-2xl bg-calm-200 overflow-hidden items-center justify-center">
        {uri ? (
          <Image source={{ uri }} className="w-full h-full" accessibilityIgnoresInvertColors />
        ) : (
          <Text className="text-calm-600 font-semibold text-lg">{psych.firstName?.[0] ?? '?'}</Text>
        )}
      </View>
      <View className="flex-1">
        <Text className="text-lg font-semibold text-calm-900 mb-0.5">{name}</Text>
        {psych.specialization ? (
          <Text className="text-accent text-sm font-medium mb-1" numberOfLines={2}>
            {psych.specialization}
          </Text>
        ) : null}
        <View className="flex-row flex-wrap gap-x-3 gap-y-1">
          {psych.rating != null ? (
            <Text className="text-calm-500 text-sm">★ {psych.rating.toFixed(1)}</Text>
          ) : null}
          {psych.experienceYears != null ? (
            <Text className="text-calm-500 text-sm">{psych.experienceYears} yil tajriba</Text>
          ) : null}
          {psych.sessionPrice != null ? (
            <Text className="text-calm-600 text-sm">{psych.sessionPrice.toLocaleString()} so‘m / soat</Text>
          ) : null}
        </View>
        {psych.isAvailable === false ? (
          <Text className="text-amber-800 text-xs mt-1">Hozircha onlayn bron qabul qilinmayapti</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
