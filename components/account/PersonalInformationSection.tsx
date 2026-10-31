'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { usersApi } from '../../lib/api/users.api';
import { authApi } from '../../lib/api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { Button, Card, Input } from '../ui';

const RESEND_COOLDOWN_SECONDS = 60;

interface ProfileFormValues {
  name: string;
  phone: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

function extractMessage(error: unknown, fallback: string): string {
  return (
    (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
      ?.message ?? fallback
  );
}

export function PersonalInformationSection() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  const { data: me, isLoading } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => usersApi.getMe().then((r) => r.data),
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const profileForm = useForm<ProfileFormValues>({
    values: me ? { name: me.name, phone: me.phone ?? '' } : undefined,
  });
  const passwordForm = useForm<PasswordFormValues>();

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const onSaveProfile = async (values: ProfileFormValues) => {
    setSavingProfile(true);
    try {
      const updated = await usersApi
        .updateMe({ name: values.name, phone: values.phone || undefined })
        .then((r) => r.data);
      queryClient.setQueryData(['users', 'me'], updated);
      setUser({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        status: updated.status,
        emailVerified: updated.emailVerified,
        // A new phone that matches a blocked person puts the account on hold.
        identityHold: updated.identityHold,
      });
      toast.success('Personal information updated');
    } catch (error: unknown) {
      toast.error(extractMessage(error, 'Failed to update information'));
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (values: PasswordFormValues) => {
    if (values.newPassword !== values.confirmPassword) {
      passwordForm.setError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }
    setSavingPassword(true);
    try {
      const res = await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success(res.data.message);
      passwordForm.reset();
    } catch (error: unknown) {
      toast.error(extractMessage(error, 'Failed to change password'));
    } finally {
      setSavingPassword(false);
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
          <Input
            label="Phone"
            type="tel"
            {...profileForm.register('phone')}
            error={profileForm.formState.errors.phone?.message}
          />
          <Input label="Email" value={me.email} disabled readOnly />
          <Button type="submit" loading={savingProfile}>
            Save changes
          </Button>
        </form>
      </Card>

      {/* Change password form */}
      <Card className="p-5">
        <p className="mb-4 text-sm font-semibold text-ink">Change password</p>
        <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            {...passwordForm.register('currentPassword', { required: 'Required' })}
            error={passwordForm.formState.errors.currentPassword?.message}
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            {...passwordForm.register('newPassword', {
              required: 'Required',
              minLength: { value: 8, message: 'At least 8 characters' },
            })}
            error={passwordForm.formState.errors.newPassword?.message}
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            {...passwordForm.register('confirmPassword', { required: 'Required' })}
            error={passwordForm.formState.errors.confirmPassword?.message}
          />
          <Button type="submit" loading={savingPassword}>
            Change password
          </Button>
        </form>
      </Card>
    </div>
  );
}
