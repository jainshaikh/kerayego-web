import { fetchPriceIndex, type PriceIndexBucket } from '../../../../../lib/api/server';

// CSV export of the public Price Index (same data and caching as the page).
// The figures are CC BY 4.0 — see the "Using this data" section on the page.
export const revalidate = 3600;

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function row(group: string, name: string, b: PriceIndexBucket): string {
  return [group, name, b.count, b.minPrice, b.medianPrice, b.avgPrice, b.maxPrice].map(csvCell).join(',');
}

export async function GET() {
  const res = await fetchPriceIndex();
  const data = res?.data;
  if (!data?.overall) {
    return new Response('Price index data is not available right now.', { status: 503 });
  }

  const lines = [
    'group,name,vehicles,lowest_pkr,median_pkr,average_pkr,highest_pkr',
    row('overall', 'pakistan', data.overall),
    ...data.byCity.map((b) => row('city', b.city, b)),
    ...data.byMake.map((b) => row('make', b.make, b)),
  ];
  const generated = data.generatedAt.slice(0, 10);

  return new Response(`${lines.join('\n')}\n`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="kerayego-price-index-${generated}.csv"`,
      // The page is the canonical, indexable version of this data.
      'X-Robots-Tag': 'noindex',
    },
  });
}
