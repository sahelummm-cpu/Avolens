import { Image } from 'react-native';

const logo = require('../../assets/images/avo-logo.png');
const ASPECT = 865 / 603; // intrinsic height / width of avo-logo.png

export function Logo({ size = 28, shadow = false }: { size?: number; shadow?: boolean }) {
  return (
    <Image
      source={logo}
      accessibilityLabel="AvoLens"
      style={{
        // The artwork is portrait; treat `size` as the height so headers keep
        // the same visual scale.
        width: size / ASPECT,
        height: size,
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
