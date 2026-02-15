import React from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const toasterStyle: React.CSSProperties & Record<`--${string}`, string> = {
  '--normal-bg': 'var(--popover)',
  '--normal-text': 'var(--popover-foreground)',
  '--normal-border': 'var(--border)',
  '--success-bg': 'var(--color-success-bg)',
  '--success-text': 'var(--color-success-text)',
  '--success-border': 'var(--color-success)',
  '--error-bg': 'var(--color-error-bg)',
  '--error-text': 'var(--color-error-text)',
  '--error-border': 'var(--color-error)',
  '--warning-bg': 'var(--color-warning-bg)',
  '--warning-text': 'var(--color-warning-text)',
  '--warning-border': 'var(--color-warning)',
  '--info-bg': 'var(--color-info-bg)',
  '--info-text': 'var(--color-info-text)',
  '--info-border': 'var(--color-info)',
};

const Toaster = (props: ToasterProps) => {
  return <Sonner className="toaster group" style={toasterStyle} {...props} />;
};

export { Toaster };
