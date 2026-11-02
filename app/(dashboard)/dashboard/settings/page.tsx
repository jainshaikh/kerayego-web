'use client';

import { PersonalInformationSection } from '../../../../components/account/PersonalInformationSection';

export default function DashboardSettingsPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your personal information, mobile number and WhatsApp updates.
        </p>
      </div>

      <PersonalInformationSection />
    </div>
  );
}
