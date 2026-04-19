import { Text, View } from 'react-native';

export function MedicalDisclaimerBanner() {
  return (
    <View className="rounded-2xl bg-calm-100 border border-calm-200 p-4 mb-4">
      <Text className="text-calm-800 text-sm leading-5">
        Bu natija qo‘llab-quvvatlovchi yo‘l-yo‘riq sifatida ko‘riladi; tibbiy diagnoz yoki muolaja o‘rnini bosmaydi. Aniq
        tashxis yoki davolash uchun malakali mutaxassisga murojaat qiling.
      </Text>
    </View>
  );
}
