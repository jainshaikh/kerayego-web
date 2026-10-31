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
  weekly: number;
  monthly: number;
}

// Plain-language sentences summarising a batch of listings, phrased so they
// read naturally whatever the numbers are (singular/plural, all vs some).
// Each is '' when there's nothing true to say.
export function describeRates(c: RateCounts): { transmission: string; hourly: string; longTerm: string } {
  if (c.total === 1) {
    return {
      transmission: `It's ${c.manual > 0 ? 'manual' : 'automatic'}.`,
      hourly: c.hourly > 0 ? 'It also has a 6- or 12-hour rate if you only need it for part of the day.' : '',
      longTerm:
        c.weekly > 0 && c.monthly > 0
          ? 'It has a weekly and a monthly price too.'
          : c.weekly + c.monthly > 0
            ? `It has a ${c.weekly > 0 ? 'weekly' : 'monthly'} price too.`
            : '',
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

  const longTerm =
    c.weekly + c.monthly === 0
      ? ''
      : all(c.weekly) && all(c.monthly)
        ? 'Every car also has a weekly and a monthly price.'
        : c.weekly > 0 && c.monthly > 0
          ? `${ofThem(c.weekly)} a weekly price, and ${countWord(c.monthly)} ${c.monthly === 1 ? 'has' : 'have'} a monthly one.`
          : `${ofThem(c.weekly || c.monthly)} a ${c.weekly > 0 ? 'weekly' : 'monthly'} price.`;

  return { transmission, hourly, longTerm };
}

// A car's plate-wide ride count (plan A17): "1 ride on KerayeGo", "23 rides on KerayeGo".
export function rideCountLabel(rideCount: number): string {
  return `${rideCount.toLocaleString('en-PK')} ${rideCount === 1 ? 'ride' : 'rides'} on KerayeGo`;
}
