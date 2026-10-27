import { TextInput, View } from 'react-native';

import { ScrollIntoView } from '@/src/components/KeyboardAwareScrollView';
import { Field, formStyles, SectionHeader } from '@/src/components/service-form/shared';
import { colors } from '@/src/constants/theme';
import type { ServiceFormValues } from '@/src/types/service';

type ServiceExperienceSectionProps = {
  values: ServiceFormValues;
  onChange: (values: ServiceFormValues) => void;
  turnaroundAiSuggested?: boolean;
};

export function ServiceExperienceSection({
  values,
  onChange,
  turnaroundAiSuggested = false,
}: ServiceExperienceSectionProps) {
  function updateField<K extends keyof ServiceFormValues>(key: K, value: ServiceFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <View style={formStyles.container}>
      <SectionHeader title="Experience & delivery" subtitle="Optional, but buyers trust it" />

      <View style={formStyles.row}>
        <View style={formStyles.rowItem}>
          <Field label="Experience (years)">
            <ScrollIntoView>
              <TextInput
                style={formStyles.input}
                value={values.experienceYears}
                onChangeText={(text) => updateField('experienceYears', text.replace(/\D/g, ''))}
                placeholder="e.g. 10"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
              />
            </ScrollIntoView>
          </Field>
        </View>
        <View style={formStyles.rowItem}>
          <Field label="Typical turnaround" aiSuggested={turnaroundAiSuggested}>
            <ScrollIntoView>
              <TextInput
                style={[formStyles.input, turnaroundAiSuggested && formStyles.inputAi]}
                value={values.turnaround}
                onChangeText={(text) => updateField('turnaround', text)}
                placeholder="e.g. 3-5 days"
                placeholderTextColor={colors.muted}
              />
            </ScrollIntoView>
          </Field>
        </View>
      </View>
    </View>
  );
}
