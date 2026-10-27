import { View } from 'react-native';

import { ServiceAvailabilitySection } from '@/src/components/service-form/ServiceAvailabilitySection';
import {
  ServiceBasicsSection,
  type ServiceAiProps,
} from '@/src/components/service-form/ServiceBasicsSection';
import { ServiceCapabilitiesSection } from '@/src/components/service-form/ServiceCapabilitiesSection';
import { ServiceExperienceSection } from '@/src/components/service-form/ServiceExperienceSection';
import { ServicePricingSection } from '@/src/components/service-form/ServicePricingSection';
import { formStyles } from '@/src/components/service-form/shared';
import type { UserAddress } from '@/src/types/auth';
import type { ServiceFormValues } from '@/src/types/service';

type ServiceFormProps = ServiceAiProps & {
  values: ServiceFormValues;
  onChange: (values: ServiceFormValues) => void;
  profileAddress?: UserAddress | null;
};

export function ServiceForm({ values, onChange, profileAddress, ...ai }: ServiceFormProps) {
  return (
    <View style={formStyles.container}>
      <ServiceBasicsSection values={values} onChange={onChange} {...ai} />
      <ServicePricingSection values={values} onChange={onChange} />
      <ServiceCapabilitiesSection
        values={values}
        onChange={onChange}
        aiSuggested={ai.aiFields?.has('capabilities')}
      />
      <ServiceExperienceSection
        values={values}
        onChange={onChange}
        turnaroundAiSuggested={ai.aiFields?.has('turnaround')}
      />
      <ServiceAvailabilitySection
        values={values}
        onChange={onChange}
        profileAddress={profileAddress}
        serviceModeAiSuggested={ai.aiFields?.has('serviceMode')}
      />
    </View>
  );
}
