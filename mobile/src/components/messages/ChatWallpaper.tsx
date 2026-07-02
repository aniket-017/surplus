import type { ReactNode } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

import { chatTheme } from '@/src/constants/chatTheme';

type ChatWallpaperProps = {
  children: ReactNode;
};

export function ChatWallpaper({ children }: ChatWallpaperProps) {
  return (
    <ImageBackground
      source={require('@/assets/images/chat-wallpaper.png')}
      style={styles.background}
      imageStyle={styles.pattern}
      resizeMode="repeat"
    >
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: chatTheme.wallpaper,
  },
  pattern: {
    opacity: 0.35,
  },
  content: {
    flex: 1,
  },
});
