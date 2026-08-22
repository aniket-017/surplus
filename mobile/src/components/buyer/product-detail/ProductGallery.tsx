import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ChatImageViewer } from '@/src/components/messages/ChatImageViewer';
import { colors, spacing } from '@/src/constants/theme';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { getImageUrl } from '@/src/lib/productsApi';

const THUMB_SIZE = 56;

type ProductGalleryProps = {
  images: string[];
  title: string;
};

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const { width: imageWidth } = useBreakpoint();
  const [activeImage, setActiveImage] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  function handleImageScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.x / imageWidth);
    setActiveImage(index);
  }

  function selectImage(index: number) {
    setActiveImage(index);
    scrollRef.current?.scrollTo({ x: index * imageWidth, animated: true });
  }

  if (images.length === 0) {
    return (
      <View style={styles.wrap}>
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>No image</Text>
        </View>
      </View>
    );
  }

  const viewerImages = images.map((uri, index) => ({
    id: `${uri}-${index}`,
    uri: getImageUrl(uri),
  }));

  return (
    <>
      <View style={styles.wrap}>
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
                style={[styles.heroImage, { width: imageWidth }]}
                contentFit="cover"
                accessibilityLabel={title}
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

      <ChatImageViewer
        images={viewerImages}
        initialIndex={activeImage}
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
        onIndexChange={setActiveImage}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceMuted,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  heroImage: {
    height: 300,
  },
  fallback: {
    height: 300,
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
    right: spacing.lg,
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
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
