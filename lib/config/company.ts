// The company that operates KerayeGo — one source for every place the site
// names it: the public footers (components/common/CompanyLegalLine.tsx), the
// "Company information" block on /about and /contact
// (components/common/CompanyInformation.tsx), /privacy, /terms and the root
// Organization JSON-LD (app/layout.tsx).
//
// Meta Business Verification (2026-11-17) refused the site because the legal
// business name wasn't on it: keep `legalName` EXACTLY as registered with SECP
// (capitals and all) and keep it in server-rendered page text — never only in
// metadata, an image or client-side script.
export const COMPANY = {
  legalName: 'KERAYEGO (SMC-PRIVATE) LIMITED',
  brandName: 'KerayeGo',
  /** SECP Corporate Unique Identification Number. */
  cuin: '0366464',
  /** FBR registration (NTN). */
  ntn: 'K671998',
  registeredOffice:
    'House Number 845/3, Muhallah Pinjra Pole, Talaab Number 2, Hyderabad City, Hyderabad, Sindh, Pakistan',
  website: 'https://www.kerayego.com',
} as const;
