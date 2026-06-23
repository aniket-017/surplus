import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ImageView from 'react-native-image-viewing';

import { cardShadow, colors, spacing } from '@/src/constants/theme';
import { getImageUrl } from '@/src/lib/productsApi';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = spacing.lg;
const IMAGE_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING * 2;
const THUMB_SIZE = 56;

type ProductGalleryProps = {
  images: string[];
  title: string;
};

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeImage, setActiveImage] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  function handleImageScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.x / IMAGE_WIDTH);
    setActiveImage(index);
  }

  function selectImage(index: number) {
    setActiveImage(index);
    scrollRef.current?.scrollTo({ x: index * IMAGE_WIDTH, animated: true });
  }

  if (images.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>No image</Text>
        </View>
      </View>
    );
  }

  const viewerImages = images.map((uri) => ({ uri: getImageUrl(uri) }));

  return (
    <>
      <View style={styles.card}>
        <Pressable onPress={() => setViewerVisible(true)}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleImageScroll}
            scrollEventThrottle={16}
          >
            {images.map((image, index) => (
              <Image
                key={`${image}-${index}`}
                source={{ uri: getImageUrl(image) }}
                style={styles.heroImage}
                contentFit="cover"
              />
            ))}
          </ScrollView>
          <View style={styles.photoCountBadge}>
            <Text style={styles.photoCountText}>
              {images.length} Photo{images.length === 1 ? '' : 's'}
            </Text>
          </View>
        </Pressable>

        {images.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbRow}
          >
            {images.map((image, index) => (
              <Pressable
                key={`thumb-${image}-${index}`}
                onPress={() => selectImage(index)}
                style={[styles.thumbWrap, index === activeImage && styles.thumbActive]}
              >
                <Image
                  source={{ uri: getImageUrl(image) }}
                  style={styles.thumb}
                  contentFit="cover"
                />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>

      {/* @ts-expect-error react-native-image-viewing types vs React 19 */}
      <ImageView
        images={viewerImages}
        imageIndex={activeImage}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
        onImageIndexChange={setActiveImage}
        presentationStyle="overFullScreen"
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    ...cardShadow,
  },
  heroImage: {
    width: IMAGE_WIDTH,
    height: 280,
  },
  fallback: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  fallbackText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(15, 27, 45, 0.72)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  photoCountText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  thumbRow: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  thumbWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: colors.accent,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
});
