import { Pressable, Text, View } from 'react-native';
import type { TestListItem } from '~/types/assessments';

type Props = {
  test: TestListItem;
  onPress: () => void;
};

export function TestCard({ test, onPress }: Props) {
  const qCount = test._count?.questions;
  return (
    <Pressable
      onPress={onPress}
      className="rounded-3xl bg-white border border-calm-200 p-5 mb-3 active:opacity-90"
      accessibilityRole="button"
    >
      <Text className="text-lg font-semibold text-calm-900 mb-1">{test.title}</Text>
      {test.category ? (
        <Text className="text-xs font-medium text-accent uppercase tracking-wide mb-2">{test.category}</Text>
      ) : null}
      {test.description ? (
        <Text className="text-calm-600 text-sm leading-5 mb-3" numberOfLines={3}>
          {test.description}
        </Text>
      ) : null}
      <View className="flex-row items-center justify-between">
        <Text className="text-calm-500 text-sm">{qCount != null ? `${qCount} ta savol` : 'Psixologik test'}</Text>
        {test.duration != null && test.duration > 0 ? (
          <Text className="text-calm-400 text-sm">~{test.duration} daq</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
