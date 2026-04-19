import { Linking, Text, View } from 'react-native';
import { PrimaryButton } from '~/components/PrimaryButton';

type Props = {
  /** When true, show expanded strip (e.g. heuristic or future backend flag). */
  emphasize?: boolean;
};

export function CrisisResourcesStrip({ emphasize }: Props) {
  const onSos = () => {
    void Linking.openURL('tel:112');
  };

  return (
    <View
      className={`rounded-2xl border p-4 mb-4 ${emphasize ? 'bg-red-50 border-red-200' : 'bg-white border-calm-200'}`}
    >
      <Text className={`text-sm font-semibold mb-2 ${emphasize ? 'text-red-900' : 'text-calm-800'}`}>
        Favqulodda yordam
      </Text>
      <Text className="text-calm-700 text-sm leading-5 mb-3">
        O‘zingizga yoki boshqalarga xavf tug‘diradigan holat sezsangiz — hozir yordam chaqiring. Ilova bu yerda faqat
        yo‘l-yo‘riq beradi.
      </Text>
      <PrimaryButton title="112 (favqulodda)" onPress={onSos} />
    </View>
  );
}
