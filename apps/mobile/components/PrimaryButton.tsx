import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native';

type Props = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'ghost';
};

export function PrimaryButton({ title, loading, variant = 'primary', disabled, ...rest }: Props) {
  const isGhost = variant === 'ghost';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      className={`rounded-2xl px-5 py-3.5 items-center justify-center ${
        isGhost ? 'bg-transparent border border-calm-300' : 'bg-accent'
      } ${disabled || loading ? 'opacity-50' : ''}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isGhost ? '#556370' : '#ffffff'} />
      ) : (
        <Text className={`text-base font-semibold ${isGhost ? 'text-calm-700' : 'text-white'}`}>{title}</Text>
      )}
    </Pressable>
  );
}
