import { permanentRedirect } from 'next/navigation';

interface PageProps {
  params: { city: string; makeModel: string; slug: string };
}

// The website's rental booking form is switched off (owner decision
// 2026-11-11, plan A82): customers send the request in the KerayeGo app,
// which asks for the pickup and drop-off points and checks the route fits the
// package (plan §3c) — the old web form could do neither. Old links to this
// form land on the car page, whose call to action points to the app.
export default function RentalRequestFormGone({ params }: PageProps) {
  permanentRedirect(`/rent-a-car/${params.city}/${params.makeModel}/${params.slug}`);
}
