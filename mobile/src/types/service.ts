import type { ProductLocation, ProductSeller } from '@/src/types/product';

export type ServicePriceType = 'per_hour' | 'per_piece' | 'per_job' | 'per_kg' | 'quote';
export type ServiceMode = 'workshop' | 'onsite' | 'both';
export type ServiceStatus = 'active' | 'paused' | 'deleted';
export type ServiceSort = 'recent' | 'price_asc';

export type Service = {
  id: string;
  listingType: 'service';
  sellerId: string;
  title: string;
  category: string;
  description: string;
  price: number;
  priceType: ServicePriceType;
  listingStatus: ServiceStatus;
  images: string[];
  location: ProductLocation;
  capabilities: string[];
  experienceYears: number | null;
  serviceMode: ServiceMode;
  turnaround: string | null;
  minimumCharge: number | null;
  viewCount?: number;
  inquiryCount?: number;
  savedCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type ServiceListing = Service & {
  seller: ProductSeller | null;
};

export type ServiceCategory = {
  name: string;
  icon: string;
  count?: number;
};

export type BrowseServicesParams = {
  search?: string;
  category?: string;
  sort?: ServiceSort;
  city?: string;
  state?: string;
  serviceMode?: ServiceMode;
  maxPrice?: number;
  limit?: number;
  skip?: number;
};

export type ServiceFormValues = {
  title: string;
  category: string;
  description: string;
  price: string;
  priceType: ServicePriceType;
  minimumCharge: string;
  capabilities: string[];
  experienceYears: string;
  turnaround: string;
  serviceMode: ServiceMode;
  location: ProductLocation;
};

export type ServiceAiDraft = {
  category: string;
  title: string;
  description: string;
  capabilities: string[];
  turnaround: string;
  serviceMode: ServiceMode | '';
};

export type ServicePhotoAnalysis = {
  category: string;
  title: string;
  caption: string;
  visibleProcesses: string[];
};

export type ServiceQualityIssue = {
  field: 'title' | 'description' | 'capabilities' | 'pricing' | 'experience' | 'turnaround' | 'photos';
  message: string;
};

export type SellerServiceStats = {
  activeServices: number;
  totalViews: number;
  totalInquiries: number;
};

export const SERVICE_PRICE_TYPE_OPTIONS: { label: string; value: ServicePriceType }[] = [
  { label: 'Per hour', value: 'per_hour' },
  { label: 'Per piece', value: 'per_piece' },
  { label: 'Per job', value: 'per_job' },
  { label: 'Per kg', value: 'per_kg' },
  { label: 'Get a quote', value: 'quote' },
];

export const SERVICE_MODE_OPTIONS: { label: string; value: ServiceMode; icon: string }[] = [
  { label: 'At my workshop', value: 'workshop', icon: 'business-outline' },
  { label: 'On-site', value: 'onsite', icon: 'navigate-outline' },
  { label: 'Both', value: 'both', icon: 'swap-horizontal-outline' },
];

export const SERVICE_MODE_LABELS: Record<ServiceMode, string> = {
  workshop: 'At workshop',
  onsite: 'On-site',
  both: 'Workshop & on-site',
};

export const emptyServiceForm = (): ServiceFormValues => ({
  title: '',
  category: '',
  description: '',
  price: '',
  priceType: 'per_hour',
  minimumCharge: '',
  capabilities: [],
  experienceYears: '',
  turnaround: '',
  serviceMode: 'workshop',
  location: {
    address: '',
    city: '',
    state: '',
    pincode: '',
  },
});

export const SERVICE_FORM_STEPS = [1, 2, 3] as const;
export type ServiceFormStep = (typeof SERVICE_FORM_STEPS)[number];

export function validateServiceStep(
  step: ServiceFormStep,
  values: ServiceFormValues,
): string | null {
  if (step === 1) {
    if (!values.category) return 'Please select a service category.';
    if (!values.title.trim()) return 'Please add a title for your service.';
    if (!values.description.trim()) return 'Please describe the service you offer.';
    return null;
  }

  if (step === 2) {
    if (values.priceType !== 'quote') {
      const rate = Number(values.price);
      if (!Number.isFinite(rate) || rate <= 0) {
        return 'Enter a rate, or choose "Quote after enquiry".';
      }
    }
    return null;
  }

  const { city, state, pincode } = values.location;
  if (!city?.trim() || !state?.trim() || !pincode?.trim()) {
    return 'Please pick your workshop location on the map.';
  }
  return null;
}

export function validateServiceForm(values: ServiceFormValues): string | null {
  for (const step of SERVICE_FORM_STEPS) {
    const error = validateServiceStep(step, values);
    if (error) return error;
  }
  return null;
}

export function serviceToFormValues(service: Service): ServiceFormValues {
  return {
    title: service.title,
    category: service.category,
    description: service.description,
    price: service.priceType === 'quote' ? '' : String(service.price),
    priceType: service.priceType,
    minimumCharge: service.minimumCharge != null ? String(service.minimumCharge) : '',
    capabilities: service.capabilities ?? [],
    experienceYears: service.experienceYears != null ? String(service.experienceYears) : '',
    turnaround: service.turnaround ?? '',
    serviceMode: service.serviceMode,
    location: {
      address: service.location.address ?? '',
      city: service.location.city,
      state: service.location.state,
      pincode: service.location.pincode,
      latitude: service.location.latitude ?? null,
      longitude: service.location.longitude ?? null,
    },
  };
}
