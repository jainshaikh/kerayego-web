// Small helpers for building natural-reading SEO copy from live listing data
// (city and make/model landing pages under /rent-a-car).

export function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK')}`;
}

// City slugs arrive lowercase from the API ("hyderabad", "dera ghazi khan").
export function cityLabel(city: string): string {
  return city
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Fallback image alt text for a rental vehicle photo when the provider didn't
// set one: "2024 Toyota Yaris ATIV CVT for rent in Multan, photo 2". Helps
// image search and Lens (Search Console's multimodal report) understand the
// photo; `index` is 1-based and omitted for a single cover image.
export function vehicleImageAlt(title: string, city?: string | null, index?: number): string {
  const base = city ? `${title} for rent in ${cityLabel(city)}` : title;
  return index ? `${base}, photo ${index}` : base;
}

// "Toyota", "Toyota and Honda", "Toyota, Honda and Suzuki"
export function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

// Small counts read better spelled out in running copy ("three cars", not "3 cars").
export function countWord(n: number, capitalize = false): string {
  const word = NUMBER_WORDS[n] ?? n.toLocaleString();
  return capitalize ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

interface RateCounts {
  /** How many cars the counts below are out of. */
  total: number;
  automatic: number;
  manual: number;
  hourly: number;
}

// Plain-language sentences summarising a batch of listings, phrased so they
// read naturally whatever the numbers are (singular/plural, all vs some).
// Each is '' when there's nothing true to say. No week or month prices: since
// 2026-11-11 they don't exist (plan A79) — the pages link to the city's
// weekly & monthly page instead.
export function describeRates(c: RateCounts): { transmission: string; hourly: string } {
  if (c.total === 1) {
    return {
      transmission: `It's ${c.manual > 0 ? 'manual' : 'automatic'}.`,
      hourly: c.hourly > 0 ? 'It also has a 6- or 12-hour rate if you only need it for part of the day.' : '',
    };
  }

  const all = (n: number) => n === c.total;
  const ofThem = (n: number) => `${countWord(n, true)} of them ${n === 1 ? 'has' : 'have'}`;

  const transmission =
    c.automatic > 0 && c.manual > 0
      ? `${countWord(c.automatic, true)} ${c.automatic === 1 ? 'car is' : 'cars are'} automatic and ${countWord(c.manual)} ${c.manual === 1 ? 'is' : 'are'} manual.`
      : `All of them are ${c.manual > 0 ? 'manual' : 'automatic'}.`;

  const hourly =
    c.hourly === 0
      ? ''
      : all(c.hourly)
        ? 'If you only need a car for part of the day, all of them have 6- or 12-hour rates.'
        : `${ofThem(c.hourly)} 6- or 12-hour rates if you only need a car for part of the day.`;

  return { transmission, hourly };
}

// A car's plate-wide ride count (plan A17): "1 ride on KerayeGo", "23 rides on KerayeGo".
export function rideCountLabel(rideCount: number): string {
  return `${rideCount.toLocaleString('en-PK')} ${rideCount === 1 ? 'ride' : 'rides'} on KerayeGo`;
}
