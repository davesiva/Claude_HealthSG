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
