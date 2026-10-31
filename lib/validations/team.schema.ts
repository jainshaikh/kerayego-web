import { z } from 'zod';
import { BusinessRole } from '../../types/enums';

// The invite-a-team-member form — kerayego-partner features/team/inviteSchema.ts.
// Limits are kerayego-backend InviteTeamMemberDto's.
export const INVITE_LIMITS = {
  fullName: 150,
  phone: 25,
} as const;

export const inviteMemberSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(INVITE_LIMITS.fullName, `Use ${INVITE_LIMITS.fullName} characters or fewer`),
  email: z.string().trim().email('Invalid email address'),
  phone: z
    .string()
    .trim()
    .max(INVITE_LIMITS.phone, `Use ${INVITE_LIMITS.phone} characters or fewer`)
    .optional(),
  role: z.enum([BusinessRole.MANAGER, BusinessRole.DRIVER]),
});

export type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>;
