import { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
};

export function Screen({ title, subtitle, children, scroll = true }: Props) {
  const inner = (
    <>
      {title ? <Text className="text-2xl font-semibold text-calm-900 mb-1">{title}</Text> : null}
      {subtitle ? <Text className="text-base text-calm-600 mb-6 leading-6">{subtitle}</Text> : null}
      {children}
    </>
  );

  return (
    <SafeAreaView className="flex-1 bg-calm-50" edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          className="flex-1 px-5 pt-2"
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {inner}
        </ScrollView>
      ) : (
        <View className="flex-1 px-5 pt-2">{inner}</View>
      )}
    </SafeAreaView>
  );
}
