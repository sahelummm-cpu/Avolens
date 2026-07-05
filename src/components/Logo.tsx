import Image from 'next/image';
import logo from '../../public/images/avo-logo.png';

export function Logo({ size = 28, shadow = false }: { size?: number; shadow?: boolean }) {
  return (
    <Image
      src={logo}
      alt="AvoLens"
      width={size}
      height={size}
      priority
      style={{
        width: size,
        height: 'auto',
        filter: shadow ? 'drop-shadow(0 10px 16px rgba(23,51,39,.22))' : undefined,
      }}
    />
  );
}
