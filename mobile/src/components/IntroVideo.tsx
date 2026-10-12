import { useEventListener } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/src/constants/theme';

const INTRO_SOURCE = require('@/assets/video/brand-intro.mp4');
/** Safety net so a stalled or broken video can never trap the user on the intro. */
const MAX_INTRO_MS = 12000;

type IntroVideoProps = {
  onFinished: () => void;
};

function hideNativeSplash() {
  SplashScreen.hideAsync().catch(() => {
    // Native splash may already be hidden.
  });
}

export function IntroVideo({ onFinished }: IntroVideoProps) {
  const insets = useSafeAreaInsets();
  const finishedRef = useRef(false);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  const player = useVideoPlayer(INTRO_SOURCE, (p) => {
    p.loop = false;
    p.play();
  });

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    hideNativeSplash();
    onFinishedRef.current();
  }, []);

  useEventListener(player, 'playToEnd', finish);
  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'error') finish();
  });

  useEffect(() => {
    const timer = setTimeout(finish, MAX_INTRO_MS);
    return () => clearTimeout(timer);
  }, [finish]);

  const handleSkip = () => {
    player.pause();
    finish();
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        onFirstFrameRender={hideNativeSplash}
      />
      <Pressable
        onPress={handleSkip}
        hitSlop={12}
        style={({ pressed }) => [
          styles.skip,
          { top: insets.top + spacing.sm },
          pressed && styles.skipPressed,
        ]}
      >
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  skip: {
    position: 'absolute',
    right: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: 'rgba(15, 27, 45, 0.08)',
  },
  skipPressed: {
    backgroundColor: 'rgba(15, 27, 45, 0.16)',
  },
  skipText: {
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '600',
  },
});
