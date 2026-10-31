'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button, Input, Modal, SegmentedTabs } from '../../ui';
import { useInviteTeamMember } from '../../../hooks/useTeam';
import { getApiErrorMessage } from '../../../hooks/useAccountDeletion';
import { BusinessRole } from '../../../types/enums';
import { BUSINESS_ROLE_LABELS } from '../../../lib/team/teamGroups';
import {
  INVITE_LIMITS,
  inviteMemberSchema,
  type InviteMemberFormValues,
} from '../../../lib/validations/team.schema';

type InvitableRole = BusinessRole.MANAGER | BusinessRole.DRIVER;

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The roles this dashboard may invite (manageableTeamRoles): Driver first, the default. */
  roles: InvitableRole[];
}

// "Invite team member" — kerayego-partner's team screen sheet: role, full
// name, email and an optional mobile number. A business admin invites
// managers and drivers; a manager only drivers (A52). The backend has the
// final say (403 / 409), shown under the form.
export function InviteMemberModal({ open, onOpenChange, roles }: InviteMemberModalProps) {
  const invite = useInviteTeamMember();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const defaultRole: InvitableRole = roles[0] ?? BusinessRole.DRIVER;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { fullName: '', email: '', phone: '', role: defaultRole },
  });

  // A fresh form every time it opens.
  useEffect(() => {
    if (open) {
      reset({ fullName: '', email: '', phone: '', role: defaultRole });
      setSubmitError(null);
      invite.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const role = watch('role');

  const onSubmit = (values: InviteMemberFormValues) => {
    setSubmitError(null);
    invite.mutate(
      {
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || undefined,
        role: values.role,
      },
      {
        onSuccess: () => {
          toast.success(
            `Invitation sent. Invited ${values.fullName.trim()} as ${BUSINESS_ROLE_LABELS[values.role].toLowerCase()}.`,
          );
          onOpenChange(false);
        },
        onError: (err) => setSubmitError(getApiErrorMessage(err, 'Could not send invite')),
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Invite team member"
      description={
        role === BusinessRole.MANAGER
          ? 'A manager helps run bookings, cars and drivers. They get an invitation to accept.'
          : 'A driver can be assigned your bookings once KerayeGo has verified them. They get an invitation to accept.'
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {roles.length > 1 ? (
          <div>
            <p className="mb-2 block text-[13px] font-semibold text-slate-700">Team role</p>
            <SegmentedTabs
              options={roles.map((r) => ({ value: r, label: BUSINESS_ROLE_LABELS[r] }))}
              value={role}
              onChange={(value) => setValue('role', value as InvitableRole)}
            />
          </div>
        ) : null}

        <Input
          label="Full name"
          placeholder="Muhammad Ali"
          maxLength={INVITE_LIMITS.fullName}
          autoComplete="off"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <Input
          label="Email address"
          type="email"
          placeholder="ali@example.com"
          autoComplete="off"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Mobile number (optional)"
          type="tel"
          placeholder="+92 300 1234567"
          maxLength={INVITE_LIMITS.phone}
          autoComplete="off"
          error={errors.phone?.message}
          {...register('phone')}
        />

        {submitError ? <p className="text-sm text-red-700">{submitError}</p> : null}

        <div className="flex justify-end gap-2.5 pt-1">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={invite.isPending}>
            Send invite
          </Button>
        </div>
      </form>
    </Modal>
  );
}
