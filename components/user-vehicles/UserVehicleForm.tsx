'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { CircleAlert } from 'lucide-react';
import { useCreateUserVehicle } from '../../hooks/useUserVehicles';
import { userVehicleSchema, type UserVehicleFormValues } from '../../lib/validations/user-vehicle.schema';
import { formatCnicInput } from '../../lib/validations/cnic.schema';
import { DocumentUploadField, type UploadedDoc } from '../trips/DocumentUploadField';
import { VehiclePhotosField } from './VehiclePhotosField';
import type { UserVehicleImageInput } from '../../lib/api/user-vehicles.api';
import { Button, Card, Input, Stepper } from '../ui';

const STEPS = [{ label: 'Vehicle' }, { label: 'Documents' }, { label: 'Review' }];

interface UserVehicleFormProps {
  cancelHref: string;
  successHref: string; // redirected here after successful submission
}

export function UserVehicleForm({ cancelHref, successHref }: UserVehicleFormProps) {
  const router = useRouter();
  const createVehicle = useCreateUserVehicle();
  const [step, setStep] = useState(1);

  // Generated once, before the vehicle exists server-side, so every upload for this
  // form (photos + documents) lands in the same per-vehicle S3 folder. Sent as the
  // record's id when the form is finally submitted.
  const [vehicleId] = useState(() => crypto.randomUUID());

  const [photos, setPhotos] = useState<UserVehicleImageInput[]>([]);
  const [cnicFront, setCnicFront] = useState<UploadedDoc | null>(null);
  const [cnicBack, setCnicBack] = useState<UploadedDoc | null>(null);
  const [drivingLicense, setDrivingLicense] = useState<UploadedDoc | null>(null);
  const [vehicleRegistration, setVehicleRegistration] = useState<UploadedDoc | null>(null);
  const [docsTouched, setDocsTouched] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserVehicleFormValues>({
    resolver: zodResolver(userVehicleSchema),
  });

  const vehicleValues = watch();

  const missingDocLabels = [
    !cnicFront && 'CNIC front',
    !cnicBack && 'CNIC back',
    !drivingLicense && 'driving licence',
    !vehicleRegistration && 'vehicle registration',
  ].filter((v): v is string => Boolean(v));
  const missingDocs = missingDocLabels.length > 0;

  const goToStep2 = async () => {
    const valid = await trigger(['make', 'model', 'plateNumber', 'year', 'cnicNumber']);
    if (valid) setStep(2);
  };

  const goToStep3 = () => {
    setDocsTouched(true);
    if (!missingDocs) setStep(3);
  };

  const onSubmit = async (values: UserVehicleFormValues) => {
    if (missingDocs || !cnicFront || !cnicBack || !drivingLicense || !vehicleRegistration) {
      toast.error('Please upload all 4 required documents');
      setStep(2);
      return;
    }

    await createVehicle.mutateAsync({
      ...values,
      id: vehicleId,
      color: values.color || undefined,
      images: photos,
      cnicFrontUrl: cnicFront.url,
      cnicFrontPublicId: cnicFront.publicId,
      cnicBackUrl: cnicBack.url,
      cnicBackPublicId: cnicBack.publicId,
      drivingLicenseUrl: drivingLicense.url,
      drivingLicensePublicId: drivingLicense.publicId,
      vehicleRegistrationUrl: vehicleRegistration.url,
      vehicleRegistrationPublicId: vehicleRegistration.publicId,
    });

    router.push(successHref);
  };

  return (
    <div className="mx-auto max-w-[760px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Add a vehicle</h1>
        <p className="mt-1 text-sm text-text-muted">
          Register your vehicle once — after admin verification, you can pick it instantly when posting future trips
          without re-uploading documents.
        </p>
      </div>

      <Stepper steps={STEPS} current={step} />

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 1 && (
          <Card padding="lg" className="space-y-5">
            <p className="text-[17px] font-semibold tracking-tight text-ink">Vehicle details</p>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Make" required placeholder="e.g. Toyota" error={errors.make?.message} {...register('make')} />
              <Input label="Model" required placeholder="e.g. Corolla" error={errors.model?.message} {...register('model')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Year"
                type="number"
                placeholder="2020"
                error={errors.year?.message}
                {...register('year', { valueAsNumber: true })}
              />
              <Input label="Color" placeholder="e.g. White" {...register('color')} />
            </div>

            <Input label="Number plate" required placeholder="e.g. ABC-123" error={errors.plateNumber?.message} {...register('plateNumber')} />

            <Input
              label="Your CNIC number"
              required
              inputMode="numeric"
              autoComplete="off"
              maxLength={15}
              placeholder="12345-1234567-1"
              className="font-mono"
              helper="Only our review team sees this — it's never shown on your listing."
              error={errors.cnicNumber?.message}
              {...register('cnicNumber', {
                onChange: (e) => setValue('cnicNumber', formatCnicInput(e.target.value)),
              })}
            />

            <div className="flex justify-end gap-2.5 pt-1">
              <Button type="button" variant="secondary" onClick={() => router.push(cancelHref)}>
                Cancel
              </Button>
              <Button type="button" onClick={goToStep2}>
                Continue
              </Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card padding="lg" className="space-y-5">
            <div>
              <p className="text-[17px] font-semibold tracking-tight text-ink">Verify your identity and the vehicle</p>
              <p className="mt-1 text-sm text-text-muted">
                Photos of the originals are fine. Documents are only visible to our review team and are never shown on
                your listing.
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-800">Vehicle photos</p>
              <p className="mb-2.5 text-xs text-text-muted">
                Shown on your trip listings — riders trust a trip more when they can see the car.
              </p>
              <VehiclePhotosField entityId={vehicleId} images={photos} onChange={setPhotos} />
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <DocumentUploadField
                label="CNIC (National ID) — front"
                hint="Clear photo of the front of your CNIC"
                value={cnicFront}
                onChange={setCnicFront}
                entityId={vehicleId}
                error={docsTouched && !cnicFront ? 'CNIC front photo is required' : undefined}
              />
              <DocumentUploadField
                label="CNIC (National ID) — back"
                hint="Clear photo of the back of your CNIC"
                value={cnicBack}
                onChange={setCnicBack}
                entityId={vehicleId}
                error={docsTouched && !cnicBack ? 'CNIC back photo is required' : undefined}
              />
              <DocumentUploadField
                label="Driving license"
                hint="Clear photo of your valid driving license"
                value={drivingLicense}
                onChange={setDrivingLicense}
                entityId={vehicleId}
                error={docsTouched && !drivingLicense ? 'Driving license photo is required' : undefined}
              />
              <DocumentUploadField
                label="Vehicle registration certificate"
                hint="Proof the vehicle is registered to you"
                value={vehicleRegistration}
                onChange={setVehicleRegistration}
                entityId={vehicleId}
                error={docsTouched && !vehicleRegistration ? 'Vehicle registration photo is required' : undefined}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-card border border-border-subtle bg-page px-5 py-4">
              {docsTouched && missingDocs ? (
                <div className="flex items-center gap-2.5">
                  <CircleAlert className="h-[17px] w-[17px] flex-shrink-0 text-amber-600" />
                  <span className="text-[13px] text-slate-600">
                    Still needed: <strong className="font-semibold text-ink">{missingDocLabels.join(', ')}</strong>.
                  </span>
                </div>
              ) : (
                <span className="text-[13px] text-text-muted">All four documents required to continue.</span>
              )}
              <div className="flex flex-shrink-0 gap-2.5">
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="button" onClick={goToStep3}>
                  Continue to review
                </Button>
              </div>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card padding="lg" className="space-y-5">
            <p className="text-[17px] font-semibold tracking-tight text-ink">Review &amp; submit</p>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-control border border-border-subtle bg-page p-4 text-sm">
              <SummaryRow label="Make" value={vehicleValues.make} />
              <SummaryRow label="Model" value={vehicleValues.model} />
              <SummaryRow label="Year" value={vehicleValues.year ? String(vehicleValues.year) : '—'} />
              <SummaryRow label="Color" value={vehicleValues.color || '—'} />
              <SummaryRow label="Plate number" value={vehicleValues.plateNumber} />
              <SummaryRow label="CNIC number" value={vehicleValues.cnicNumber} />
              <SummaryRow label="Photos" value={`${photos.length} added`} />
              <SummaryRow label="Documents" value="4 of 4 uploaded" />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-card border border-status-amber-border bg-status-amber-bg px-5 py-4">
              <span className="text-[13px] text-status-amber-fg">
                Your vehicle stays a draft until all four documents are approved. You can keep editing it in the
                meantime.
              </span>
            </div>

            <div className="flex justify-end gap-2.5">
              <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Submit for verification
              </Button>
            </div>
          </Card>
        )}
      </form>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs text-text-faint">{label}</div>
      <div className="mt-0.5 font-medium text-ink">{value || '—'}</div>
    </div>
  );
}
