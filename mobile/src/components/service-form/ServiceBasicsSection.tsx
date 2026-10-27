import { TextInput, View } from 'react-native';

import { ScrollIntoView } from '@/src/components/KeyboardAwareScrollView';
import { ServiceCategoryPicker } from '@/src/components/service-form/ServiceCategoryPicker';
import {
  AiActionButton,
  AiReplacementCard,
  Field,
  formStyles,
  SectionHeader,
} from '@/src/components/service-form/shared';
import { colors } from '@/src/constants/theme';
import type { ServiceFormValues } from '@/src/types/service';

type ReplaceableField = 'title' | 'description';

export type ServiceAiProps = {
  aiFields?: ReadonlySet<keyof ServiceFormValues>;
  pending?: Partial<Record<ReplaceableField, string>>;
  onAcceptPending?: (field: ReplaceableField) => void;
  onDismissPending?: (field: ReplaceableField) => void;
};

type ServiceBasicsSectionProps = ServiceAiProps & {
  values: ServiceFormValues;
  onChange: (values: ServiceFormValues) => void;
  showHeader?: boolean;
  onImprove?: () => void;
  improving?: boolean;
};

export function ServiceBasicsSection({
  values,
  onChange,
  showHeader = true,
  aiFields,
  pending,
  onAcceptPending,
  onDismissPending,
  onImprove,
  improving,
}: ServiceBasicsSectionProps) {
  function updateField<K extends keyof ServiceFormValues>(key: K, value: ServiceFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  const titleAi = aiFields?.has('title') ?? false;
  const descriptionAi = aiFields?.has('description') ?? false;
  const canImprove = Boolean(onImprove && (values.title.trim() || values.description.trim()));

  return (
    <View style={formStyles.container}>
      {showHeader ? (
        <SectionHeader
          title="Service details"
          subtitle="Tell buyers what job work you do"
          showDivider={false}
        />
      ) : null}

      <Field label="Service category">
        <ServiceCategoryPicker
          value={values.category}
          onChange={(category) => updateField('category', category)}
          aiSuggested={aiFields?.has('category')}
        />
      </Field>

      <Field label="Title" aiSuggested={titleAi}>
        <ScrollIntoView>
          <TextInput
            style={[formStyles.input, titleAi && formStyles.inputAi]}
            value={values.title}
            onChangeText={(text) => updateField('title', text)}
            placeholder="e.g. VMC job work for automotive components"
            placeholderTextColor={colors.muted}
          />
        </ScrollIntoView>
        {pending?.title && onAcceptPending && onDismissPending ? (
          <AiReplacementCard
            value={pending.title}
            onAccept={() => onAcceptPending('title')}
            onDismiss={() => onDismissPending('title')}
          />
        ) : null}
      </Field>

      <Field
        label="Description"
        aiSuggested={descriptionAi}
        hint={
          onImprove
            ? 'Write in Hindi, Marathi or English. AI can turn it into a clear English listing.'
            : undefined
        }
        action={
          canImprove ? (
            <AiActionButton label="Improve with AI" loading={improving} onPress={onImprove!} />
          ) : null
        }
      >
        <ScrollIntoView>
          <TextInput
            style={[formStyles.input, formStyles.textArea, descriptionAi && formStyles.inputAi]}
            value={values.description}
            onChangeText={(text) => updateField('description', text)}
            placeholder="Machines, materials you work with, tolerances, typical jobs, clients served..."
            placeholderTextColor={colors.muted}
            multiline
          />
        </ScrollIntoView>
        {pending?.description && onAcceptPending && onDismissPending ? (
          <AiReplacementCard
            value={pending.description}
            onAccept={() => onAcceptPending('description')}
            onDismiss={() => onDismissPending('description')}
          />
        ) : null}
      </Field>
    </View>
  );
}
