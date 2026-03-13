import express from 'express'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json())

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
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages
      })
    })

    if (!response.ok) {
      const error = await response.text()
      return res.status(response.status).json({ error })
    }

    const data = await response.json()
    res.json(data)
  } catch (err) {
    console.error('Anthropic API error:', err)
    res.status(500).json({ error: 'Failed to reach Anthropic API' })
  }
})

// SPA fallback — serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`HealthSG server running on port ${PORT}`)
})
