// Hand-written context for the city landing pages (/rent-a-car/[city]).
// Deliberately limited to well-established geographic facts about each city —
// nothing about KerayeGo's own service there (inventory, prices, provider
// counts all come from live API data on the page itself, never from here).
// Written in our own words, not lifted from Wikipedia or a competitor page.
// Keyed by the lowercase city slug the backend's /listings/meta/cities returns;
// a city with no entry here just renders without the extra context.
//
// A city listed here also gets a real (but noindexed) page while it has zero
// listings — e.g. Sukkur before any provider joins there — and the page
// becomes indexable on its own once the first listing goes live. A slug with
// no profile and no listings is a 404.
export interface CityProfile {
  region: string;
  context: string;
  /** Hand-written, city-specific paragraphs shown in the "Car rental in X" section. */
  about?: string[];
  /** City-specific FAQ entries, added ahead of the shared ones (and to FAQPage JSON-LD). */
  faqs?: { question: string; answer: string }[];
  /** Carpool route pages worth linking from this city (they noindex themselves when empty). */
  routes?: { href: string; label: string }[];
}

export const CITY_PROFILES: Record<string, CityProfile> = {
  lahore: {
    region: 'Punjab',
    context: 'Lahore is Punjab’s capital and the second-biggest city in Pakistan.',
  },
  karachi: {
    region: 'Sindh',
    context: 'Karachi is the biggest city in Pakistan and the capital of Sindh.',
    about: [
      'It’s a coastal city on the Arabian Sea and the country’s main port, and it covers a huge area. If you have several stops to make in one day, having your own car can be simpler than booking ride after ride.',
      'Jinnah International Airport is in Karachi, and the M-9 motorway takes you to Hyderabad, around 160 km away. Rules on out-of-city trips are set by each provider, so if you plan to leave Karachi, mention it when you send your request.',
    ],
    faqs: [
      {
        question: 'Can I take a car rented in Karachi to Hyderabad or another city?',
        answer:
          'That’s up to the provider. Some are happy for you to drive out of Karachi and some aren’t, so tell them your route when you send the booking request, or ask them on WhatsApp first.',
      },
    ],
    routes: [
      { href: '/carpool/karachi-to-hyderabad', label: 'Karachi to Hyderabad carpool' },
      { href: '/carpool/hyderabad-to-karachi', label: 'Hyderabad to Karachi carpool' },
    ],
  },
  islamabad: {
    region: 'Islamabad Capital Territory',
    context: 'Islamabad is the federal capital, and Rawalpindi sits right next door as its twin city.',
  },
  rawalpindi: {
    region: 'Punjab',
    context: 'Rawalpindi and Islamabad are twin cities that sit right next to each other in the north of Punjab.',
  },
  faisalabad: {
    region: 'Punjab',
    context: 'Faisalabad is Pakistan’s third-biggest city and one of the main centres of its textile trade.',
  },
  multan: {
    region: 'Punjab',
    context:
      'Multan sits in southern Punjab and is one of the oldest cities in Pakistan. Many people know it as the City of Saints.',
  },
  peshawar: {
    region: 'Khyber Pakhtunkhwa',
    context: 'Peshawar is the capital of Khyber Pakhtunkhwa.',
  },
  quetta: {
    region: 'Balochistan',
    context: 'Quetta is the capital of Balochistan.',
  },
  hyderabad: {
    region: 'Sindh',
    context:
      'Hyderabad is the second-biggest city in Sindh, Pakistan, and only a short drive from Karachi on the M-9 motorway.',
    about: [
      'Just to be clear, this page is about Hyderabad in Sindh, not Hyderabad in India. The city sits on the east bank of the Indus, with Jamshoro on the other side of the river.',
      'Karachi is around 160 km to the south-west, and Hyderabad lies on the main road north towards upper Sindh and Punjab. If you’re coming in from Karachi for a wedding or a family visit, you can pick a car here before you travel and sort out pickup with the provider.',
    ],
    faqs: [
      {
        question: 'Are these cars in Hyderabad, Sindh or Hyderabad, India?',
        answer:
          'Every car on this page is in Hyderabad, Sindh, Pakistan. KerayeGo only lists cars in Pakistan at the moment.',
      },
      {
        question: 'Can I drive a car rented in Hyderabad to Karachi?',
        answer:
          'It depends on the provider. Let them know where you want to go when you send your booking request, or message them on WhatsApp before you book.',
      },
    ],
    routes: [
      { href: '/carpool/hyderabad-to-karachi', label: 'Hyderabad to Karachi carpool' },
      { href: '/carpool/karachi-to-hyderabad', label: 'Karachi to Hyderabad carpool' },
    ],
  },
  // Sindh cities with no listings yet — the page exists (noindexed) so it's
  // ready the moment a provider there lists a car.
  sukkur: {
    region: 'Sindh',
    context:
      'Sukkur sits on the Indus in upper Sindh, right across the river from Rohri, and is known for the Sukkur Barrage. The M-5 motorway connects it with Multan.',
  },
  larkana: {
    region: 'Sindh',
    context: 'Larkana is in upper Sindh, not far from the ancient city of Mohenjo-daro.',
  },
  nawabshah: {
    region: 'Sindh',
    context: 'Nawabshah is the main town of Shaheed Benazirabad district, in the middle of Sindh.',
  },
};
