import { Image, StyleSheet } from 'react-native';

type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
};

const sizes = {
  sm: 40,
  md: 56,
  lg: 72,
} as const;

export function Logo({ size = 'md' }: LogoProps) {
  const height = sizes[size];

  return (
    <Image
      source={require('@/assets/logo/surplus.png')}
      style={[styles.logo, { height, width: height * 2.8 }]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center',
  },
});
