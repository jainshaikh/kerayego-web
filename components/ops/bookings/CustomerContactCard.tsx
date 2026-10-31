'use client';

import { Mail, MessageCircle, Phone } from 'lucide-react';
import { buttonVariants } from '../../ui';
import { callUrl, emailUrl, whatsappUrl } from '../../../lib/ops/bookingDisplay';
import type { Market } from '../../../types/api.types';
import type { BookingCustomer } from '../../../types/booking-requests.types';
import { DetailRow, SectionCard } from './BookingBits';

// Who sent the request and the ways to reach them — Call (tel:, for a phone
// or a desktop calling app), WhatsApp and Email. A button is left out when
// there's nothing to use it with.
export function CustomerContactCard({ customer, market }: { customer: BookingCustomer; market: Market | null | undefined }) {
  const tel = callUrl(customer.phone);
  const whatsapp = whatsappUrl(customer.phone, market);
  const mail = emailUrl(customer.email);

  return (
    <SectionCard title="Customer">
      <div className="space-y-1.5">
        <DetailRow label="Name" value={customer.name} />
        <DetailRow label="Phone" value={<span className="font-mono">{customer.phone?.trim() || 'Not given'}</span>} />
        <DetailRow label="Email" value={customer.email} />
      </div>
      {tel || whatsapp || mail ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {tel ? (
            <a href={tel} className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
              <Phone className="h-3.5 w-3.5" />
              Call
            </a>
          ) : null}
          {whatsapp ? (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'whatsapp', size: 'sm' })}>
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          ) : null}
          {mail ? (
            <a href={mail} className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
              <Mail className="h-3.5 w-3.5" />
              Email
            </a>
          ) : null}
        </div>
      ) : null}
    </SectionCard>
  );
}
