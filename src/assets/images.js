// ═══════════════════════════════════════════════════════════════════
// Curated editorial imagery — Unsplash direct URLs
//
// Every entry includes:
//   - src    : direct Unsplash CDN URL (auto format, sized for context)
//   - alt    : descriptive alt text for screen readers
//   - credit : photographer name + Unsplash link (for attribution block)
//
// All photos are from Unsplash under the Unsplash License. We render
// attribution in the footer's credits section.
// ═══════════════════════════════════════════════════════════════════

const U = (id, w = 1600, q = 80) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=${q}`

// ── Hero / top-of-page imagery ────────────────────────────────────
export const HERO = {
  singapore_skyline: {
    src: U('1508964942454-1a56651d54ac', 2200, 82),
    srcSmall: U('1508964942454-1a56651d54ac', 1000, 75),
    alt: 'Singapore Marina Bay Sands and city skyline at blue hour',
    credit: {
      photographer: 'Timo Volz',
      url: 'https://unsplash.com/photos/rjZ-ds139hQ',
    },
  },
  people_active: {
    src: U('1571019613454-1cb2f99b2d8b', 1800, 80),
    alt: 'People exercising outdoors in a park at sunrise',
    credit: {
      photographer: 'Danielle Cerullo',
      url: 'https://unsplash.com/photos/CQfNt66ttZM',
    },
  },
}

// ── Per-category imagery (matches CATEGORIES from snapshotData.js) ─
export const CATEGORY_IMAGES = {
  demographics: {
    src: U('1577896851231-70ef18881754', 1200, 80),
    alt: 'Three generations of an Asian family smiling together',
    credit: {
      photographer: 'Tyler Nix',
      url: 'https://unsplash.com/photos/P6YF5-ROEj0',
    },
  },
  chronic: {
    src: U('1576091160399-112ba8d25d1d', 1200, 80),
    alt: 'A doctor in a white coat reviewing a patient chart with a stethoscope',
    credit: {
      photographer: 'National Cancer Institute',
      url: 'https://unsplash.com/photos/L8tWZT4CcVQ',
    },
  },
  lifestyle: {
    src: U('1544367567-0f2fcb009e0b', 1200, 80),
    alt: 'A woman practising yoga on a mat in bright morning light',
    credit: {
      photographer: 'Dane Wetton',
      url: 'https://unsplash.com/photos/t1NEMSm1YgA',
    },
  },
  healthcare: {
    src: U('1519494026892-80bbd2d6fd0d', 1200, 80),
    alt: 'A modern hospital corridor with soft natural light',
    credit: {
      photographer: 'Martha Dominguez de Gouveia',
      url: 'https://unsplash.com/photos/nMyM7fxpokE',
    },
  },
  longevity: {
    src: U('1505576399279-565b52d4ac71', 1200, 80),
    alt: 'An elderly couple walking together through a leafy park',
    credit: {
      photographer: 'Matt Bennett',
      url: 'https://unsplash.com/photos/78hTqvjYMS4',
    },
  },
}

// ── Editorial section dividers (full-bleed pull-quote backgrounds) ─
export const DIVIDER_IMAGES = {
  // Between Explorer and HealthMap — "the living city"
  hdb_living: {
    src: U('1533628635777-112b2239b1c7', 1800, 80),
    alt: 'High-density public housing estate in Singapore against a dramatic sky',
    credit: {
      photographer: 'Swapnil Bapat',
      url: 'https://unsplash.com/photos/sPt5RIjDdv8',
    },
  },
  // Between InsightLab and Global — "everyday care"
  clinic_care: {
    src: U('1538108149393-fbbd81895907', 1800, 80),
    alt: 'A nurse consulting with a patient in a clinic setting',
    credit: {
      photographer: 'Online Marketing',
      url: 'https://unsplash.com/photos/hIgeoQjS_iE',
    },
  },
}

// ── Timeline era banners (thin header strip above each chapter card) ─
// All three are authentic Singapore imagery, sourced from Wikimedia Commons
// under CC licences, downloaded into /public/images/timeline/ so they stay
// stable even if Wikimedia thumbnail paths change.
//   foundation    — historic Singapore General Hospital (c.1906–1935)
//   chronic_shift — SGH facade (2008) — modern SG medical institution
//   prevention    — East Coast Park (2023) — the "City in a Garden" era
//   road_ahead    — deliberately imageless; the future is unwritten
export const TIMELINE_ERAS = {
  // 1965–1990 — heritage of SG's oldest hospital; the medical institution
  // Singapore was built upon as it launched Medisave and conquered TB.
  foundation: {
    src: '/images/timeline/foundation-sgh-historic.jpg',
    alt: 'Historic photograph of Singapore General Hospital (c.1906\u20131935) \u2014 the heritage Singapore\u2019s modern public health was built upon',
    credit: {
      photographer: 'Max H. Hilckes / KITLV (via Wikimedia Commons, CC BY 4.0)',
      url: 'https://commons.wikimedia.org/wiki/File:Singapore._General_Hospital.,_KITLV_1404902.tiff',
    },
    tone: '#5370E0',
  },
  // 1990–2010 — modern SGH facade. As NCDs rose, specialist medicine and
  // teaching hospitals defined the era. SGH is SG's oldest and largest.
  chronic_shift: {
    src: '/images/timeline/chronic-sgh-facade.jpg',
    alt: 'The facade of Singapore General Hospital \u2014 the modern medical institution that anchored SG\u2019s shift to chronic disease management',
    credit: {
      photographer: 'Jaytothez (via Wikimedia Commons, CC BY-SA 3.0)',
      url: 'https://commons.wikimedia.org/wiki/File:Singapore_General_Hospital_Facade.JPG',
    },
    tone: '#EC4899',
  },
  // 2010–Present — War on Diabetes. People moving outdoors captures the
  // pivot from clinical treatment to population-level prevention.
  prevention: {
    src: U('1571019613454-1cb2f99b2d8b', 1400, 78),
    alt: 'People exercising outdoors at sunrise \u2014 Singapore\u2019s pivot from treatment to everyday prevention',
    credit: {
      photographer: 'Danielle Cerullo',
      url: 'https://unsplash.com/photos/CQfNt66ttZM',
    },
    tone: '#F59E0B',
  },
  // 2030 — no photo. Treat as a forward-looking gradient card.
}

// ── Global comparisons — world / cross-country imagery ────────────
export const GLOBAL_IMAGES = {
  world_context: {
    src: U('1451187580459-43490279c0fa', 1600, 80),
    alt: 'Planet Earth at night, city lights visible from orbit',
    credit: {
      photographer: 'NASA',
      url: 'https://unsplash.com/photos/CpsTAUPoScw',
    },
  },
}

// ── Combined attribution list for the footer credits block ────────
export function collectCredits() {
  const all = [
    ...Object.values(HERO),
    ...Object.values(CATEGORY_IMAGES),
    ...Object.values(DIVIDER_IMAGES),
    ...Object.values(TIMELINE_ERAS),
    ...Object.values(GLOBAL_IMAGES),
  ]
  const seen = new Set()
  return all
    .map(e => e.credit)
    .filter(c => {
      const key = `${c.photographer}|${c.url}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}
