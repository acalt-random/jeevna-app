import { useWindowDimensions } from 'react-native';

export type DeviceType = 'phone' | 'tablet' | 'web' | 'desktop';

export function useDeviceType(): DeviceType {
  const { width } = useWindowDimensions();

  if (width < 768) {
    return 'phone';
  } else if (width < 1024) {
    return 'tablet';
  } else if (width < 1200) {
    return 'web';
  } else {
    return 'desktop';
  }
}