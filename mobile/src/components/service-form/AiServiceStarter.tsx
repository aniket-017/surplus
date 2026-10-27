import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScrollIntoView } from '@/src/components/KeyboardAwareScrollView';
import { ProductImageSourceSheet } from '@/src/components/ProductImageSourceSheet';
import { MAX_SERVICE_IMAGES } from '@/src/components/ServicePhotosSection';
import { AI_COLOR, AI_TINT } from '@/src/components/service-form/shared';
import { colors, spacing } from '@/src/constants/theme';
import type { LocalImage } from '@/src/types/product';

export type AiStarterStatus = 'idle' | 'drafted' | 'manual';

const EXAMPLES = [
  'We do TIG and MIG welding for SS and MS, mostly automotive parts. Job done in 2-3 days.',
  '3 VMC machines, aluminium and steel components, batch and prototype jobs.',
  'Powder coating aur zinc plating karte hain, industrial parts ke liye.',
];

type AiServiceStarterProps = {
  status: AiStarterStatus;
  generating: boolean;
  onGenerate: (text: string) => void;
  onPhotosPicked: (images: LocalImage[]) => void;
  onManual: () => void;
  onReopen: () => void;
};

export function AiServiceStarter({
  status,
  generating,
  onGenerate,
  onPhotosPicked,
  onManual,
  onReopen,
}: AiServiceStarterProps) {
  const [text, setText] = useState('');
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);

  if (status !== 'idle') {
    const drafted = status === 'drafted';
    return (
      <View style={[styles.banner, drafted && styles.bannerAi]}>
        <Ionicons
          name={drafted ? 'sparkles' : 'create-outline'}
          size={18}
          color={drafted ? AI_COLOR : colors.muted}
        />
        <Text style={styles.bannerText}>
          {drafted
            ? 'AI drafted your listing. Check the fields marked "AI suggested" and edit anything that looks off.'
            : 'Filling in manually.'}
        </Text>
        <Pressable onPress={onReopen} hitSlop={8}>
          <Text style={styles.bannerLink}>{drafted ? 'Redo' : 'Use AI'}</Text>
        </Pressable>
      </View>
    );
  }

  const canGenerate = text.trim().length >= 10 && !generating;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="sparkles" size={16} color={AI_COLOR} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Create your service faster</Text>
          <Text style={styles.subtitle}>
            Describe what you do once. AI fills in the details, you confirm.
          </Text>
        </View>
      </View>

      <Text style={styles.label}>Describe your work</Text>
      <ScrollIntoView>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="e.g. We do TIG and MIG welding for stainless and mild steel, mostly automotive parts"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={1500}
        />
      </ScrollIntoView>
      <Text style={styles.hint}>Type in Hindi, Marathi, Hinglish or English.</Text>

      {!text ? (
        <View style={styles.examples}>
          {EXAMPLES.map((example) => (
            <Pressable key={example} style={styles.exampleChip} onPress={() => setText(example)}>
              <Text style={styles.exampleText} numberOfLines={1}>
                {example}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Pressable
        style={[styles.generateBtn, !canGenerate && styles.generateBtnDisabled]}
        onPress={() => onGenerate(text)}
        disabled={!canGenerate}
        accessibilityRole="button"
        accessibilityLabel="Generate listing with AI"
      >
        {generating ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Ionicons name="sparkles" size={16} color={colors.white} />
            <Text style={styles.generateText}>Generate listing</Text>
          </>
        )}
      </Pressable>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.optionRow}>
        <Pressable
          style={styles.option}
          onPress={() => setPhotoSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Upload a work photo"
        >
          <Ionicons name="camera-outline" size={20} color={AI_COLOR} />
          <Text style={styles.optionTitle}>Upload a work photo</Text>
          <Text style={styles.optionHint}>AI identifies the service</Text>
        </Pressable>
        <Pressable
          style={styles.option}
          onPress={onManual}
          accessibilityRole="button"
          accessibilityLabel="Fill manually"
        >
          <Ionicons name="create-outline" size={20} color={colors.navy} />
          <Text style={styles.optionTitle}>Fill manually</Text>
          <Text style={styles.optionHint}>Choose a category below</Text>
        </Pressable>
      </View>

      <ProductImageSourceSheet
        visible={photoSheetOpen}
        remainingSlots={MAX_SERVICE_IMAGES}
        onClose={() => setPhotoSheetOpen(false)}
        onImagesSelected={(images) => {
          setPhotoSheetOpen(false);
          if (images.length) onPhotosPicked(images);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
    backgroundColor: '#FBF9FF',
  },
  header: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AI_TINT,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.textStrong,
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  input: {
    minHeight: 96,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textStrong,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.15)',
    textAlignVertical: 'top',
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
  },
  examples: {
    gap: 6,
  },
  exampleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: AI_TINT,
  },
  exampleText: {
    color: AI_COLOR,
    fontSize: 12,
    fontWeight: '600',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: AI_COLOR,
  },
  generateBtnDisabled: {
    opacity: 0.45,
  },
  generateText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(15, 27, 45, 0.15)',
  },
  dividerText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  option: {
    flex: 1,
    gap: 4,
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionTitle: {
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '700',
  },
  optionHint: {
    color: colors.muted,
    fontSize: 12,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.bgSubtle,
  },
  bannerAi: {
    backgroundColor: AI_TINT,
  },
  bannerText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  bannerLink: {
    color: AI_COLOR,
    fontSize: 13,
    fontWeight: '700',
  },
});
