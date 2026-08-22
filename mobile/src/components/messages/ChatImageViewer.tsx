import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ViewerImage = {
  id: string;
  uri: string;
};

type ChatImageViewerProps = {
  images: ViewerImage[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
};

export function ChatImageViewer({
  images,
  initialIndex,
  visible,
  onClose,
  onIndexChange,
}: ChatImageViewerProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ViewerImage>>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (!visible || images.length === 0) return;

    const nextIndex = Math.min(initialIndex, images.length - 1);
    setCurrentIndex(nextIndex);
    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: nextIndex, animated: false });
    }, 0);

    return () => clearTimeout(timer);
  }, [images.length, initialIndex, visible]);

  function goToImage(index: number) {
    if (index < 0 || index >= images.length) return;
    setCurrentIndex(index);
    onIndexChange?.(index);
    listRef.current?.scrollToIndex({ index, animated: true });
  }

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.max(
      0,
      Math.min(Math.round(event.nativeEvent.contentOffset.x / width), images.length - 1),
    );
    setCurrentIndex(index);
    onIndexChange?.(index);
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <FlatList
          ref={listRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={Math.min(initialIndex, Math.max(0, images.length - 1))}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={handleScrollEnd}
          renderItem={({ item }) => (
            <View style={[styles.imagePage, { width, height }]}>
              <Image source={{ uri: item.uri }} style={styles.image} contentFit="contain" />
            </View>
          )}
        />

        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.counter}>
            {currentIndex + 1} / {images.length}
          </Text>
          <Pressable
            style={styles.controlButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close image viewer"
          >
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
        </View>

        {images.length > 1 ? (
          <>
            <Pressable
              style={[styles.navButton, styles.previousButton]}
              onPress={() => goToImage(currentIndex - 1)}
              disabled={currentIndex === 0}
              accessibilityRole="button"
              accessibilityLabel="Previous image"
            >
              <Ionicons
                name="chevron-back"
                size={30}
                color={currentIndex === 0 ? 'rgba(255,255,255,0.3)' : '#fff'}
              />
            </Pressable>
            <Pressable
              style={[styles.navButton, styles.nextButton]}
              onPress={() => goToImage(currentIndex + 1)}
              disabled={currentIndex === images.length - 1}
              accessibilityRole="button"
              accessibilityLabel="Next image"
            >
              <Ionicons
                name="chevron-forward"
                size={30}
                color={
                  currentIndex === images.length - 1 ? 'rgba(255,255,255,0.3)' : '#fff'
                }
              />
            </Pressable>
          </>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080e18',
  },
  imagePage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.34)',
  },
  counter: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 46,
    height: 46,
    marginTop: -23,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  previousButton: {
    left: 12,
  },
  nextButton: {
    right: 12,
  },
});
