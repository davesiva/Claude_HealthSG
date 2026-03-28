/**
 * Verified policy facts for grounding AI-generated insurance updates.
 *
 * HOW TO UPDATE:
 *   When a new MOH announcement or policy change happens, add or update
 *   the relevant entry below with the date, source URL, and key facts.
 *   The AI prompt uses these facts as grounding context so its summary
 *   stays accurate and current — even beyond the model's training cutoff.
 *
 * LAST REVIEWED: 2026-03-28
 */

export const POLICY_LAST_REVIEWED = '2026-03-28'

export const POLICY_FACTS = [
  // ── MediShield Life ──
  {
    topic: 'MediShield Life',
    updated: '2025-04',
    source: 'MOH MediShield Life 2024 Review',
    facts: [
      'MediShield Life premiums increased from April 2025, phased over 3 years (April 2025–March 2028), capped at 35% total increase.',
      'Government providing S$4.1 billion in support measures — more than the S$1.8 billion total premium increase.',
      'Annual claim limit raised from S$150,000 to S$200,000.',
      'Higher premium subsidies for lower/middle-income older Singaporeans (up to 60%, from 50%).',
      'MediSave Grant for Newborns increased from S$4,000 to S$5,000.',
      'Outpatient deductible to be introduced on 1 June 2026 (date revised from original 1 Jan 2026). MediSave withdrawal limits will be adjusted to cover revised deductibles.',
      'Phase 2 of inpatient deductible increase takes effect 1 April 2027.',
      'MediShield Life coverage for risk-reducing mastectomy (RRM) targeted by Q3 2026; risk-reducing bilateral salpingo-oophorectomy (RRBSO) by Q4 2026.',
    ],
  },

  // ── Integrated Shield Plans & Riders ──
  {
    topic: 'Integrated Shield Plan (IP) Riders',
    updated: '2025-11-27',
    source: 'https://www.moh.gov.sg/newsroom/new-requirements-for-integrated-shield-plan-riders-to-strengthen-sustainability-of-private-health-insurance-and-address-rising-healthcare-costs/',
    facts: [
      'From 1 April 2026, new IP riders can NO LONGER cover the minimum IP deductible (currently S$1,500–S$3,500 depending on ward class).',
      'Minimum co-payment cap raised from S$3,000 to S$6,000 per policy year (excludes the deductible).',
      'Minimum 5% co-payment requirement (introduced in 2019) remains unchanged.',
      'Existing policyholders who purchased riders after 27 Nov 2025 must transition to compliant products by 1 April 2028.',
      'New private hospital riders expected to cost ~30% less than current maximum-coverage riders — estimated savings of ~S$600/year for private, ~S$200/year for public hospital riders.',
      'MOH data: IP holders with riders make claims 1.4x more frequently with 1.4x larger average claim sizes.',
      'Deductibles and co-payments can still be paid from MediSave (subject to withdrawal limits).',
    ],
  },
  {
    topic: 'IP Rider Premium Reductions (insurer announcements)',
    updated: '2026-03',
    source: 'Straits Times, insurer press releases',
    facts: [
      'New-design IP rider premiums dropping at least 30%, with some insurers offering up to 84% cuts.',
      'Premium reductions apply to riders sold from April 2026 under the new MOH requirements.',
      'Older age bands (50–70) expected to see the largest absolute savings.',
    ],
  },

  // ── CareShield Life ──
  {
    topic: 'CareShield Life',
    updated: '2025-08',
    source: 'https://www.moh.gov.sg/newsroom/government-accepts-careshield-life-council-s-recommendations-to-enhance-careshield-life--provides-additional--570-million-to-subsidise-premiums/',
    facts: [
      'Government accepted CareShield Life Council 2025 Review on 27 August 2025; changes effective progressively from 1 January 2026.',
      'Annual payout growth rate doubled from 2% to 4% — monthly payout reaches S$806 by 2030 (vs. S$731 under prior rate).',
      'Eligibility threshold unchanged at severe disability (3 or more ADLs).',
      'Underwriting criteria reinstated for Optional Cohorts (born 1979 or earlier) from 2026 — can still enrol if no pre-existing disabilities.',
      'Government providing S$570 million in additional support 2026–2030: S$440M broad-based transitional, S$130M+ means-tested subsidies (up to 30% offset for lower/middle-income).',
      'Annual premium increases moderated to ~S$38 on average, capped at S$75/year.',
      'Premiums remain fully payable from MediSave; no one loses coverage due to inability to pay.',
      'From 2026: CareShield Life claimants automatically assessed for related schemes (e.g., Home Caregiving Grant), reducing need for multiple applications.',
    ],
  },

  // ── MediSave ──
  {
    topic: 'MediSave',
    updated: '2025-10',
    source: 'CPF Board, MOH',
    facts: [
      'Flexi-MediSave outpatient limit raised from S$300 to S$400/year from October 2025.',
      'MediSave withdrawal limit for IP premiums: S$800/year (age ≤80), S$1,150/year (age 81+).',
      'MediSave contribution rate: 8–10.5% of salary depending on age.',
      'Broader coverage for outpatient scans and chronic/preventive care being phased in (2026–2027).',
    ],
  },

  // ── Matched MediSave Scheme ──
  {
    topic: 'Matched MediSave Scheme (MMSS)',
    updated: '2026-01',
    source: 'https://www.moh.gov.sg/newsroom/more-singaporeans-eligible-for-matching-government-grants-for-cash-top-ups-to-boost-retirement-and-healthcare-savings/',
    facts: [
      'New pilot scheme effective 1 January 2026, running through 2030.',
      'Eligibility: Singapore Citizens aged 55–70 with MediSave balance below S$39,500 (50% of the S$79,000 Basic Healthcare Sum in 2026).',
      'Government matches cash top-ups to MediSave dollar-for-dollar, up to S$1,000 per year.',
      'Matching grant is credited the following year (e.g., 2026 top-ups → grant credited in early 2027).',
      'No application required — CPF auto-assesses and notifies eligible members at the start of each year.',
      'Approximately 185,000 Singaporeans eligible in 2026.',
      'Top-ups attracting the MMSS match are NOT eligible for tax relief.',
    ],
  },
]
