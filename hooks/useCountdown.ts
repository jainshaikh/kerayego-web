'use client';

import { useEffect, useState } from 'react';

/**
 * Counts a resend cooldown down to 0, one second at a time. Shared by the
 * in-app WhatsApp verification (PhoneVerificationFlow) and the phone sign-in
 * flow (PhoneAuthFlow).
 */
export function useCountdown(initialSeconds = 0) {
  const [seconds, setSeconds] = useState(initialSeconds);
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [seconds]);
  return [seconds, setSeconds] as const;
}
