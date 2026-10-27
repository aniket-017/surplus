import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScrollIntoView } from '@/src/components/KeyboardAwareScrollView';
import {
  AI_COLOR,
  AI_TINT,
  AiBadge,
  formStyles,
  SectionHeader,
} from '@/src/components/service-form/shared';
import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/constants/theme';
import { suggestServiceCapabilities } from '@/src/lib/servicesApi';
import type { ServiceFormValues } from '@/src/types/service';

export const MAX_CAPABILITIES = 12;
const AI_SUGGEST_DELAY_MS = 1500;

export const CAPABILITY_SUGGESTIONS: Record<string, string[]> = {
  'CNC / VMC Machining': ['3-axis VMC', '4-axis VMC', '5-axis CNC', 'HMC', 'Prototype jobs', 'Batch production'],
  'Turning & Lathe Work': ['CNC turning', 'Conventional lathe', 'Threading', 'Max dia 300mm'],
  Welding: ['TIG', 'MIG', 'Arc welding', 'Spot welding', 'Aluminium welding', 'SS welding'],
  Fabrication: ['MS fabrication', 'SS fabrication', 'Structural work', 'Jigs & fixtures'],
  'Sheet Metal & Laser Cutting': ['Fiber laser', 'CNC bending', 'Punching', 'Max sheet 3mm'],
  'Press Shop / Stamping': ['Power press', 'Hydraulic press', 'Progressive dies', 'Deep drawing'],
  Grinding: ['Surface grinding', 'Cylindrical grinding', 'Centreless grinding'],
  'Heat Treatment': ['Hardening', 'Tempering', 'Induction hardening', 'Case carburizing'],
  'Plating / Powder Coating / Painting': ['Zinc plating', 'Powder coating', 'Chrome plating', 'ED coating'],
  'Tool & Die Making': ['Press tools', 'Moulds', 'Wire EDM', 'Spark EDM'],
  'Casting & Forging': ['Sand casting', 'Die casting', 'Hot forging', 'Investment casting'],
  'Plastic Injection Moulding': ['Up to 250 T machines', 'Mould design', 'Insert moulding'],
  'Machine Repair & Maintenance': ['CNC repair', 'Hydraulics', 'Preventive maintenance', 'Retrofitting'],
  'Electrical & Automation (PLC)': ['PLC programming', 'Panel wiring', 'SCADA', 'Servo drives'],
  'Inspection & Testing (CMM)': ['CMM inspection', 'NABL lab', 'Hardness testing', 'PPAP documents'],
  'Industrial Transport': ['Tempo', 'Truck', 'Crane / hydra', 'Machine shifting'],
};

type ServiceCapabilitiesSectionProps = {
  values: ServiceFormValues;
  onChange: (values: ServiceFormValues) => void;
  aiSuggested?: boolean;
  showHeader?: boolean;
  aiSuggestions?: boolean;
};

export function ServiceCapabilitiesSection({
  values,
  onChange,
  aiSuggested = false,
  showHeader = true,
  aiSuggestions = true,
}: ServiceCapabilitiesSectionProps) {
  const { token } = useAuth();
  const [draft, setDraft] = useState('');
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const cacheRef = useRef(new Map<string, string[]>());
  const capabilitiesRef = useRef(values.capabilities);
  capabilitiesRef.current = values.capabilities;

  const signature = `${values.category}|${values.title.trim()}|${values.description.trim()}`;
  const hasContext =
    Boolean(values.category) &&
    (values.title.trim().length >= 6 || values.description.trim().length >= 20);

  useEffect(() => {
    if (!aiSuggestions || !token || !hasContext) return;

    const cached = cacheRef.current.get(signature);
    if (cached) {
      setAiTags(cached);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoadingAi(true);
      try {
        const suggestions = await suggestServiceCapabilities(token, {
          category: values.category,
          title: values.title,
          description: values.description,
          existing: capabilitiesRef.current,
        });
        cacheRef.current.set(signature, suggestions);
        if (!cancelled) setAiTags(suggestions);
      } catch {
        // AI suggestions are a bonus; the static chips still work.
      } finally {
        if (!cancelled) setLoadingAi(false);
      }
    }, AI_SUGGEST_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [aiSuggestions, token, hasContext, signature]);

  function addCapability(raw: string) {
    const value = raw.trim();
    if (!value || values.capabilities.length >= MAX_CAPABILITIES) return;
    const exists = values.capabilities.some((item) => item.toLowerCase() === value.toLowerCase());
    if (!exists) {
      onChange({ ...values, capabilities: [...values.capabilities, value] });
    }
    setDraft('');
  }

  function removeCapability(index: number) {
    onChange({ ...values, capabilities: values.capabilities.filter((_, i) => i !== index) });
  }

  const taken = new Set(values.capabilities.map((item) => item.toLowerCase()));
  const staticSuggestions = (CAPABILITY_SUGGESTIONS[values.category] ?? []).filter(
    (item) => !taken.has(item.toLowerCase()),
  );
  const staticKeys = new Set(staticSuggestions.map((item) => item.toLowerCase()));
  const aiOnly = aiTags.filter(
    (item) => !taken.has(item.toLowerCase()) && !staticKeys.has(item.toLowerCase()),
  );
  const canAdd = values.capabilities.length < MAX_CAPABILITIES;

  return (
    <View style={formStyles.container}>
      {showHeader ? (
        <SectionHeader
          title="Capabilities"
          subtitle="Tap to add machines, processes and limits buyers should know about"
        />
      ) : null}

      {values.capabilities.length > 0 ? (
        <View style={formStyles.chipRow}>
          {aiSuggested ? <AiBadge /> : null}
          {values.capabilities.map((capability, index) => (
            <View key={`${capability}-${index}`} style={styles.capabilityChip}>
              <Text style={styles.capabilityText}>{capability}</Text>
              <Pressable
                onPress={() => removeCapability(index)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${capability}`}
              >
                <Ionicons name="close" size={14} color={colors.accentHover} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {canAdd && (staticSuggestions.length > 0 || aiOnly.length > 0 || loadingAi) ? (
        <View style={formStyles.chipRow}>
          {staticSuggestions.map((item) => (
            <Pressable key={item} style={styles.suggestionChip} onPress={() => addCapability(item)}>
              <Ionicons name="add" size={14} color={colors.muted} />
              <Text style={styles.suggestionText}>{item}</Text>
            </Pressable>
          ))}
          {aiOnly.map((item) => (
            <Pressable
              key={`ai-${item}`}
              style={[styles.suggestionChip, styles.aiChip]}
              onPress={() => addCapability(item)}
            >
              <Ionicons name="sparkles" size={12} color={AI_COLOR} />
              <Text style={[styles.suggestionText, styles.aiChipText]}>{item}</Text>
            </Pressable>
          ))}
          {loadingAi ? (
            <View style={[styles.suggestionChip, styles.aiChip]}>
              <ActivityIndicator size="small" color={AI_COLOR} />
              <Text style={[styles.suggestionText, styles.aiChipText]}>Finding more…</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {canAdd ? (
        <View style={styles.inputRow}>
          <ScrollIntoView style={formStyles.flex}>
            <TextInput
              style={formStyles.input}
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={() => addCapability(draft)}
              placeholder="Add your own e.g. Max job 1200mm"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              blurOnSubmit={false}
            />
          </ScrollIntoView>
          <Pressable
            style={[styles.addButton, !draft.trim() && styles.addButtonDisabled]}
            onPress={() => addCapability(draft)}
            disabled={!draft.trim()}
            accessibilityRole="button"
            accessibilityLabel="Add capability"
          >
            <Ionicons name="add" size={20} color={colors.white} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  capabilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
  },
  capabilityText: {
    color: colors.accentHover,
    fontSize: 13,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.45,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(15, 27, 45, 0.2)',
  },
  suggestionText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  aiChip: {
    borderColor: 'rgba(124, 58, 237, 0.35)',
    backgroundColor: AI_TINT,
  },
  aiChipText: {
    color: AI_COLOR,
  },
});
