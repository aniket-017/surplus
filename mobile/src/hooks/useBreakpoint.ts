import { useWindowDimensions } from 'react-native';

import {
  categoryGridColumns,
  contentMaxWidth,
  isTabletWidth,
  productGridColumns,
} from '@/src/constants/layout';

export function useBreakpoint() {
  const { width, height } = useWindowDimensions();
  const isTablet = isTabletWidth(width);

  return {
    width,
    height,
    isTablet,
    columns: productGridColumns(width),
    categoryColumns: categoryGridColumns(width),
    contentMaxWidth: contentMaxWidth(width),
  };
}
