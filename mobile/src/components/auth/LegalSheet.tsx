import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LegalBlock, LegalDoc } from '@/src/constants/legal';
import { colors, fonts, spacing } from '@/src/constants/theme';

const SHEET_HEIGHT = Dimensions.get('window').height * 0.75;
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 1.2;

export function LegalSheet({ doc, onClose }: { doc: LegalDoc | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [shownDoc, setShownDoc] = useState<LegalDoc | null>(null);
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdrop = useSharedValue(0);
  const closingRef = useRef(false);
  const openRef = useRef(false);

  useEffect(() => {
    if (!doc) return;
    setShownDoc(doc);
    // A refreshed copy of an already open doc only swaps the content.
    if (openRef.current && !closingRef.current) return;
    openRef.current = true;
    closingRef.current = false;
    translateY.value = SHEET_HEIGHT;
    backdrop.value = withTiming(1, { duration: 260 });
    translateY.value = withSpring(0, { damping: 18, stiffness: 170, mass: 0.9 });
  }, [backdrop, doc, translateY]);

  function finishClose() {
    openRef.current = false;
    setShownDoc(null);
    onClose();
  }

  function close() {
    if (closingRef.current) return;
    closingRef.current = true;
    backdrop.value = withTiming(0, { duration: 220 });
    translateY.value = withTiming(
      SHEET_HEIGHT,
      { duration: 220, easing: Easing.in(Easing.cubic) },
      (done) => {
        if (done) runOnJS(finishClose)();
      },
    );
  }

  const closeRef = useRef(close);
  closeRef.current = close;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        translateY.value = Math.max(0, g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_DISTANCE || g.vy > DISMISS_VELOCITY) {
          closeRef.current();
        } else {
          translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
        }
      },
      onPanResponderTerminate: () => {
        translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
      },
    }),
  ).current;

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const isTerms = shownDoc?.kind === 'terms';

  return (
    <Modal
      visible={shownDoc !== null}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close" />
        </Animated.View>

        <Animated.View style={[styles.sheet, sheetStyle]}>
          {shownDoc && (
            <>
              <View {...panResponder.panHandlers} style={styles.header}>
                <View style={styles.handle} />
                <View style={styles.headerRow}>
                  <View style={styles.headerIcon}>
                    <Ionicons
                      name={isTerms ? 'document-text-outline' : 'shield-checkmark-outline'}
                      size={20}
                      color={colors.accent}
                    />
                  </View>
                  <View style={styles.headerText}>
                    <Text style={styles.title}>{shownDoc.title}</Text>
                    <Text style={styles.updated}>Last updated {shownDoc.updated}</Text>
                  </View>
                  <Pressable onPress={close} hitSlop={10} style={styles.closeButton}>
                    <Ionicons name="close" size={20} color={colors.textStrong} />
                  </Pressable>
                </View>
              </View>

              <ScrollView
                style={styles.body}
                contentContainerStyle={[
                  styles.bodyContent,
                  { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.lg },
                ]}
                showsVerticalScrollIndicator
              >
                {shownDoc.intro.length > 0 && (
                  <Animated.View entering={FadeInDown.delay(120).duration(360)} style={styles.section}>
                    {shownDoc.intro.map((block, i) => (
                      <LegalBlockView key={i} block={block} intro />
                    ))}
                  </Animated.View>
                )}

                {shownDoc.sections.map((section, i) => (
                  <Animated.View
                    key={`${i}-${section.heading}`}
                    entering={FadeInDown.delay(160 + Math.min(i, 6) * 60).duration(360)}
                    style={styles.section}
                  >
                    <Text style={styles.sectionHeading}>{section.heading}</Text>
                    {section.blocks.map((block, j) => (
                      <LegalBlockView key={j} block={block} />
                    ))}
                  </Animated.View>
                ))}
              </ScrollView>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

function LegalBlockView({ block, intro = false }: { block: LegalBlock; intro?: boolean }) {
  if (block.type === 'bullet') {
    return (
      <View style={styles.bulletRow}>
        <View style={styles.bulletDot} />
        <Text style={styles.bulletText}>{block.text}</Text>
      </View>
    );
  }
  return <Text style={intro ? styles.intro : styles.paragraph}>{block.text}</Text>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 27, 45, 0.45)',
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 16,
  },
  header: {
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.textStrong,
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  updated: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  intro: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.medium,
  },
  section: {
    gap: spacing.xs,
  },
  sectionHeading: {
    color: colors.textStrong,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  paragraph: {
    color: colors.text,
    fontSize: 13.5,
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingLeft: 2,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    backgroundColor: colors.accent,
  },
  bulletText: {
    flex: 1,
    color: colors.text,
    fontSize: 13.5,
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
});
