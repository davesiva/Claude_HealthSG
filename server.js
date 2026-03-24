import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json({ limit: '1mb' }))

// Serve static files from Vite build
app.use(express.static(join(__dirname, 'dist')))

// Proxy endpoint for Anthropic API
app.post('/api/chat', async (req, res) => {
  const { messages, systemPrompt, maxTokens = 1024 } = req.body

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`Anthropic API ${response.status}:`, error)
      return res.status(response.status).json({ error })
    }

    const data = await response.json()
    res.json(data)
  } catch (err) {
    console.error('Anthropic API error:', err.message, err.stack)
    res.status(500).json({ error: `Failed to reach Anthropic API: ${err.message}` })
  }
})

// Proxy endpoint for SingStat Table Builder API
// Caches responses for 24 hours to avoid unnecessary requests
const singstatCache = new Map()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

app.get('/api/singstat/:tableId', async (req, res) => {
  const { tableId } = req.params

  // Validate table ID format (alphanumeric only)
  if (!/^[A-Za-z0-9]+$/.test(tableId)) {
    return res.status(400).json({ error: 'Invalid table ID' })
  }

  // Check cache
  const cached = singstatCache.get(tableId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    res.set('X-Cache', 'HIT')
    return res.json(cached.data)
  }

  try {
    const response = await fetch(
      `https://tablebuilder.singstat.gov.sg/api/table/tabledata/${tableId}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      return res.status(response.status).json({ error: `SingStat API returned ${response.status}` })
    }

    const data = await response.json()

    // Cache the response
    singstatCache.set(tableId, { data, timestamp: Date.now() })
    res.set('X-Cache', 'MISS')
    res.json(data)
  } catch (err) {
    console.error(`SingStat API error for ${tableId}:`, err.message)
    res.status(502).json({ error: 'Failed to reach SingStat API' })
  }
})

// Proxy endpoint for OneMap Population Query API
const onemapCache = new Map()
const ONEMAP_CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days (census data doesn't change)

app.get('/api/onemap/population', async (req, res) => {
  const { planningArea, year } = req.query
  if (!planningArea || !year) {
    return res.status(400).json({ error: 'planningArea and year are required' })
  }

  const token = process.env.ONEMAP_TOKEN
  if (!token) {
    return res.status(500).json({ error: 'OneMap token not configured' })
  }

  const cacheKey = `${planningArea}_${year}`
  const cached = onemapCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < ONEMAP_CACHE_TTL) {
    return res.json(cached.data)
  }

  try {
    const url = `https://www.onemap.gov.sg/api/public/popapi/getPopulationAgeGroup?token=${encodeURIComponent(token)}&planningArea=${encodeURIComponent(planningArea)}&year=${encodeURIComponent(year)}`
    const response = await fetch(url)

    if (!response.ok) {
      const text = await response.text()
      console.error(`OneMap API ${response.status}:`, text)
      return res.status(response.status).json({ error: `OneMap API returned ${response.status}` })
    }

    const data = await response.json()
    onemapCache.set(cacheKey, { data, timestamp: Date.now() })
    res.json(data)
  } catch (err) {
    console.error('OneMap API error:', err.message)
    res.status(502).json({ error: 'Failed to reach OneMap API' })
  }
})

// SPA fallback — serve index.html for all other routes
// Use explicit callback instead of path pattern for Express 5 compatibility
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    res.sendFile(join(__dirname, 'dist', 'index.html'))
  } else {
    next()
  }
})

app.listen(PORT, () => {
  console.log(`Middle-Out server running on port ${PORT}`)
})
