import { CameraView, useCameraPermissions, type CameraType, type FlashMode } from 'expo-camera';
import { Image } from 'expo-image';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '@/src/constants/theme';
import { buildAttachmentFromUri, type ChatAttachment } from '@/src/lib/chatAttachments';

type CameraCaptureModalProps = {
  visible: boolean;
  onClose: () => void;
  onCapture: (attachment: ChatAttachment) => void;
  permissionMessage?: string;
};

const FLASH_ORDER: FlashMode[] = ['off', 'auto', 'on'];
const FLASH_ICON: Record<FlashMode, keyof typeof Ionicons.glyphMap> = {
  off: 'flash-off',
  auto: 'flash-outline',
  on: 'flash',
};
const FLASH_LABEL: Record<FlashMode, string> = {
  off: 'Off',
  auto: 'Auto',
  on: 'On',
};

export function CameraCaptureModal({
  visible,
  onClose,
  onCapture,
  permissionMessage = 'Allow camera access to take and send photos in chat.',
}: CameraCaptureModalProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [capturing, setCapturing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const reset = useCallback(() => {
    setPreview(null);
    setCapturing(false);
    setFlash('off');
    setFacing('back');
    setCameraReady(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  function cycleFlash() {
    setFlash((current) => {
      const next = FLASH_ORDER[(FLASH_ORDER.indexOf(current) + 1) % FLASH_ORDER.length];
      return next;
    });
  }

  function flipCamera() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  async function takePhoto() {
    if (!cameraRef.current || capturing || !cameraReady) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        setPreview(photo.uri);
      }
    } finally {
      setCapturing(false);
    }
  }

  function usePhoto() {
    if (!preview) return;
    onCapture(buildAttachmentFromUri(preview, `photo-${Date.now()}.jpg`, 'image/jpeg'));
    reset();
    onClose();
  }

  const permissionDenied = permission ? !permission.granted : false;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <StatusBar barStyle="light-content" />
      <View style={styles.root}>
        {!permission ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.white} size="large" />
          </View>
        ) : permissionDenied ? (
          <SafeAreaView style={styles.centered}>
            <Ionicons name="camera-outline" size={56} color="rgba(255,255,255,0.7)" />
            <Text style={styles.permissionTitle}>Camera access needed</Text>
            <Text style={styles.permissionText}>{permissionMessage}</Text>
            <Pressable style={styles.permissionButton} onPress={() => void requestPermission()}>
              <Text style={styles.permissionButtonText}>Grant access</Text>
            </Pressable>
            <Pressable style={styles.permissionCancel} onPress={handleClose}>
              <Text style={styles.permissionCancelText}>Cancel</Text>
            </Pressable>
          </SafeAreaView>
        ) : preview ? (
          <View style={styles.flex}>
            <Image source={{ uri: preview }} style={styles.flex} contentFit="contain" />
            <SafeAreaView edges={['top']} style={styles.topBarFloating}>
              <Pressable style={styles.iconButton} onPress={() => setPreview(null)} hitSlop={8}>
                <Ionicons name="arrow-back" size={24} color={colors.white} />
              </Pressable>
            </SafeAreaView>
            <SafeAreaView edges={['bottom']} style={styles.reviewBar}>
              <Pressable style={styles.reviewRetake} onPress={() => setPreview(null)}>
                <Ionicons name="refresh" size={20} color={colors.white} />
                <Text style={styles.reviewRetakeText}>Retake</Text>
              </Pressable>
              <Pressable style={styles.reviewUse} onPress={usePhoto}>
                <Text style={styles.reviewUseText}>Use Photo</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.white} />
              </Pressable>
            </SafeAreaView>
          </View>
        ) : (
          <View style={styles.flex}>
            <CameraView
              ref={cameraRef}
              style={styles.flex}
              facing={facing}
              flash={flash}
              onCameraReady={() => setCameraReady(true)}
            />

            <SafeAreaView edges={['top']} style={styles.topBar}>
              <Pressable style={styles.iconButton} onPress={handleClose} hitSlop={8}>
                <Ionicons name="close" size={26} color={colors.white} />
              </Pressable>
              <Pressable style={styles.flashButton} onPress={cycleFlash} hitSlop={8}>
                <Ionicons name={FLASH_ICON[flash]} size={20} color={colors.white} />
                <Text style={styles.flashLabel}>{FLASH_LABEL[flash]}</Text>
              </Pressable>
            </SafeAreaView>

            <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
              <View style={styles.bottomSide} />
              <Pressable
                style={styles.shutterOuter}
                onPress={() => void takePhoto()}
                disabled={capturing || !cameraReady}
              >
                <View style={styles.shutterRing}>
                  {capturing ? (
                    <ActivityIndicator color={colors.navy} />
                  ) : (
                    <View style={styles.shutterInner} />
                  )}
                </View>
              </Pressable>
              <View style={styles.bottomSide}>
                <Pressable style={styles.flipButton} onPress={flipCamera} hitSlop={8}>
                  <Ionicons name="camera-reverse-outline" size={26} color={colors.white} />
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  permissionTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  permissionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  permissionButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  permissionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  permissionCancel: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  permissionCancelText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  topBarFloating: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  flashButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  flashLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  bottomSide: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  shutterOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  shutterRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.white,
  },
  reviewBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  reviewRetake: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  reviewRetakeText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  reviewUse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
  },
  reviewUseText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
