'use client';

import styles from './PrimaryButton.module.css';
import clsx from 'clsx';

export function PrimaryButton({
  children,
  onClick,
  small,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  small?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button type={type} className={clsx(styles.btn, small && styles.small)} onClick={onClick}>
      {children}
    </button>
  );
}
