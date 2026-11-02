'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { usersApi } from '../../lib/api/users.api';
import { authApi } from '../../lib/api/auth.api';
import { useApplyUser, useMe } from '../../hooks/usePhoneVerification';
import { formatPhoneForDisplay } from '../../lib/utils/phone';
import { StatusBadge } from '../common/StatusBadge';
import { Button, Card, Input, Modal } from '../ui';
import { PhoneVerificationFlow } from './PhoneVerificationFlow';
import { WhatsAppUpdatesCard } from './WhatsAppUpdatesCard';

const RESEND_COOLDOWN_SECONDS = 60;

interface ProfileFormValues {
  name: string;
}

function extractMessage(error: unknown, fallback: string): string {
  return (
    (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
      ?.message ?? fallback
  );
}

export function PersonalInformationSection() {
  const applyUser = useApplyUser();
  const { data: me, isLoading } = useMe();

  const [savingProfile, setSavingProfile] = useState(false);
  // The mobile number changes only through a WhatsApp code (send-code → verify).
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const profileForm = useForm<ProfileFormValues>({
    values: me ? { name: me.name } : undefined,
  });

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const onSaveProfile = async (values: ProfileFormValues) => {
    setSavingProfile(true);
    try {
      const updated = await usersApi.updateMe({ name: values.name }).then((r) => r.data);
      applyUser(updated);
      toast.success('Personal information updated');
    } catch (error: unknown) {
      toast.error(extractMessage(error, 'Failed to update information'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await authApi.resendVerification();
      toast.success(res.data.message);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error: unknown) {
      toast.error(extractMessage(error, 'Failed to resend verification email'));
    } finally {
      setResending(false);
    }
  };

  if (isLoading || !me) {
    return <div className="h-64 animate-pulse rounded-xl bg-slate-100" />;
  }

  return (
    <div className="space-y-6">
      {/* Email verification status */}
      <Card className="p-5">
        <p className="mb-3 text-sm font-semibold text-ink">Email verification</p>
        {me.emailVerified ? (
          <p className="flex items-center gap-1.5 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            Your email ({me.email}) is verified.
          </p>
        ) : (
          <div>
            <p className="flex items-center gap-1.5 text-sm text-amber-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {me.email} is not verified yet.
            </p>
            <Button
              size="sm"
              className="mt-3"
              onClick={handleResend}
              loading={resending}
              disabled={cooldown > 0}
            >
              {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend verification email'}
            </Button>
          </div>
        )}
      </Card>

      {/* Personal information form */}
      <Card className="p-5">
        <p className="mb-4 text-sm font-semibold text-ink">Personal information</p>
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
          <Input
            label="Full name"
            required
            {...profileForm.register('name', { required: 'Name is required' })}
            error={profileForm.formState.errors.name?.message}
          />
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Mobile number</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-control border border-border-subtle bg-page px-3.5 py-2.5">
              <span className="text-[15px] text-ink">
                {me.phone ? formatPhoneForDisplay(me.phone) : 'No number yet'}
              </span>
              {me.phoneVerified ? (
                <>
                  <StatusBadge status="verified" label="Verified" size="sm" />
                  <button
                    type="button"
                    onClick={() => setPhoneDialogOpen(true)}
                    className="ml-auto text-sm font-semibold text-brand-600 hover:underline"
                  >
                    Change number
                  </button>
                </>
              ) : (
                <span className="text-sm text-text-muted">
                  Not verified ·{' '}
                  <button
                    type="button"
                    onClick={() => setPhoneDialogOpen(true)}
                    className="font-semibold text-brand-600 hover:underline"
                  >
                    Verify
                  </button>
                </span>
              )}
            </div>
          </div>
          <Input label="Email" value={me.email} disabled readOnly />
          <Button type="submit" loading={savingProfile}>
            Save changes
          </Button>
        </form>
      </Card>

      <WhatsAppUpdatesCard me={me} />

      <Modal
        open={phoneDialogOpen}
        onOpenChange={setPhoneDialogOpen}
        title={me.phoneVerified ? 'Change mobile number' : 'Verify your mobile number'}
        description="We'll send a 6-digit code to the number on WhatsApp."
      >
        {/* Mounted only while open, so each opening starts at step 1. */}
        {phoneDialogOpen ? (
          <PhoneVerificationFlow
            initialPhone={me.phoneVerified ? null : me.phone}
            onVerified={() => {
              setPhoneDialogOpen(false);
              toast.success('Your mobile number is verified.');
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}
