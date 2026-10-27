import type { ImageSourcePropType } from 'react-native';

import { formatPrice } from '@/src/lib/productFormat';
import type { Service, ServiceCategory } from '@/src/types/service';

type ServiceCategoryTheme = {
  icon: string;
  color: string;
  tint: string;
  image?: ImageSourcePropType;
};

export const SERVICE_CATEGORIES: (ServiceCategory & {
  color: string;
  tint: string;
  image?: ImageSourcePropType;
})[] = [
  {
    name: 'CNC / VMC Machining',
    icon: 'cog-outline',
    color: '#2563EB',
    tint: '#E8F0FE',
    image: require('@/assets/images/services/cnc-vmc.jpg'),
  },
  {
    name: 'Turning & Lathe Work',
    icon: 'sync-outline',
    color: '#0891B2',
    tint: '#E0F7FA',
    image: require('@/assets/images/services/turning-lathe.jpg'),
  },
  {
    name: 'Welding',
    icon: 'flame-outline',
    color: '#EA580C',
    tint: '#FFF1E6',
    image: require('@/assets/images/services/welding.jpg'),
  },
  {
    name: 'Fabrication',
    icon: 'construct-outline',
    color: '#5CB335',
    tint: '#EEF8E8',
    image: require('@/assets/images/services/fabrication.jpg'),
  },
  {
    name: 'Sheet Metal & Laser Cutting',
    icon: 'flash-outline',
    color: '#DC2626',
    tint: '#FDECEC',
    image: require('@/assets/images/services/sheet-metal-laser.jpg'),
  },
  {
    name: 'Press Shop / Stamping',
    icon: 'contract-outline',
    color: '#7C3AED',
    tint: '#F3EDFF',
    image: require('@/assets/images/services/press-stamping.jpg'),
  },
  {
    name: 'Grinding',
    icon: 'disc-outline',
    color: '#475569',
    tint: '#EEF2F6',
    image: require('@/assets/images/services/grinding.jpg'),
  },
  {
    name: 'Heat Treatment',
    icon: 'thermometer-outline',
    color: '#E11D48',
    tint: '#FDECF1',
    image: require('@/assets/images/services/heat-treatment.jpg'),
  },
  {
    name: 'Plating / Powder Coating / Painting',
    icon: 'color-palette-outline',
    color: '#DB2777',
    tint: '#FDEAF4',
    image: require('@/assets/images/services/coating-painting.jpg'),
  },
  {
    name: 'Tool & Die Making',
    icon: 'hammer-outline',
    color: '#B45309',
    tint: '#FEF3E2',
    image: require('@/assets/images/services/tool-die.jpg'),
  },
  {
    name: 'Casting & Forging',
    icon: 'bonfire-outline',
    color: '#C2410C',
    tint: '#FFEDE5',
    image: require('@/assets/images/services/casting-forging.jpg'),
  },
  {
    name: 'Plastic Injection Moulding',
    icon: 'cube-outline',
    color: '#0D9488',
    tint: '#E3F7F4',
    image: require('@/assets/images/services/injection-moulding.jpg'),
  },
  {
    name: 'Machine Repair & Maintenance',
    icon: 'build-outline',
    color: '#0F1B2D',
    tint: '#E8ECF1',
    image: require('@/assets/images/services/machine-repair.jpg'),
  },
  {
    name: 'Electrical & Automation (PLC)',
    icon: 'hardware-chip-outline',
    color: '#CA8A04',
    tint: '#FEF7E0',
    image: require('@/assets/images/services/electrical-automation.jpg'),
  },
  {
    name: 'Inspection & Testing (CMM)',
    icon: 'scan-outline',
    color: '#4F46E5',
    tint: '#EEEDFE',
    image: require('@/assets/images/services/inspection-cmm.jpg'),
  },
  {
    name: 'Industrial Transport',
    icon: 'car-outline',
    color: '#16A34A',
    tint: '#E7F7EC',
    image: require('@/assets/images/services/industrial-transport.jpg'),
  },
  {
    name: 'Others',
    icon: 'layers-outline',
    color: '#5A6B7D',
    tint: '#EEF2F6',
    image: require('@/assets/images/services/others.jpg'),
  },
];

export const SERVICE_CATEGORY_NAMES = SERVICE_CATEGORIES.map((item) => item.name);

const THEME_BY_NAME = new Map<string, ServiceCategoryTheme>(
  SERVICE_CATEGORIES.map((item) => [
    item.name,
    { icon: item.icon, color: item.color, tint: item.tint, image: item.image },
  ]),
);

const FALLBACK_THEME: ServiceCategoryTheme = {
  icon: 'layers-outline',
  color: '#5A6B7D',
  tint: '#EEF2F6',
};

export function getServiceCategoryTheme(category: string): ServiceCategoryTheme {
  return THEME_BY_NAME.get(category) ?? FALLBACK_THEME;
}

const PRICE_UNIT_SUFFIX: Record<string, string> = {
  per_hour: ' / hour',
  per_piece: ' / piece',
  per_job: ' / job',
  per_kg: ' / kg',
};

export function formatServicePrice(service: Pick<Service, 'price' | 'priceType'>) {
  if (service.priceType === 'quote') return 'Get a quote';
  return `${formatPrice(service.price)}${PRICE_UNIT_SUFFIX[service.priceType] ?? ''}`;
}
