import { Image } from 'react-native';

const logo = require('../../assets/images/avo-logo.png');
const ASPECT = 893 / 996; // intrinsic height / width of avo-logo.png

export function Logo({ size = 28, shadow = false }: { size?: number; shadow?: boolean }) {
  return (
    <Image
      source={logo}
      accessibilityLabel="AvoLens"
      style={{
        width: size,
        height: size * ASPECT,
        resizeMode: 'contain',
        ...(shadow
          ? {
              shadowColor: 'rgba(23,51,39,1)',
              shadowOpacity: 0.22,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 10 },
            }
          : null),
      }}
    />
  );
}
