'use client';

import React, { useState, useEffect } from 'react';

interface NoAutofillPasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  showPassword?: boolean;
}

/**
 * Password input that prevents Chromium/Edge Password Manager from leaking
 * saved admin credentials into customer login/registration forms on the same origin.
 * Uses CSS `-webkit-text-security: disc` on `type="text"` where supported (Edge/Chrome/Safari),
 * and gracefully falls back to `type="password"` with delayed unlock on Firefox.
 */
export function NoAutofillPasswordInput({
  showPassword = false,
  className = '',
  onFocus,
  ...props
}: NoAutofillPasswordInputProps) {
  const [supportsTextSecurity, setSupportsTextSecurity] = useState(true);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
      setSupportsTextSecurity(CSS.supports('-webkit-text-security', 'disc'));
    }
  }, []);

  const inputType = showPassword ? 'text' : supportsTextSecurity ? 'text' : 'password';
  const maskedClass = !showPassword && supportsTextSecurity ? 'password-masked' : '';

  return (
    <input
      {...props}
      type={inputType}
      autoComplete="one-time-code"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      data-lpignore="true"
      data-1p-ignore="true"
      data-form-type="other"
      readOnly={!supportsTextSecurity && !unlocked}
      onFocus={(e) => {
        if (!unlocked) setUnlocked(true);
        onFocus?.(e);
      }}
      className={`${className} ${maskedClass}`.trim()}
    />
  );
}
