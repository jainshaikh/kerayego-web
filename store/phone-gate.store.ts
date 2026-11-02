import { create } from 'zustand';

// Raised by lib/api/client.ts when any request answers 403 PHONE_NOT_VERIFIED.
// components/account/PhoneGateListener.tsx (mounted once in the root layout)
// refetches GET /users/me, which makes PhoneVerificationGate show the verify
// screen, then lowers it. Kept apart from auth.store, which imports client.ts.
interface PhoneGateState {
  phoneNotVerified: boolean;
  raise: () => void;
  lower: () => void;
}

export const usePhoneGateStore = create<PhoneGateState>()((set) => ({
  phoneNotVerified: false,
  raise: () => set({ phoneNotVerified: true }),
  lower: () => set({ phoneNotVerified: false }),
}));
