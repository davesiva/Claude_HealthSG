export async function askHealthSG(messages, systemPrompt, maxTokens = 1024) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages,
      systemPrompt,
      maxTokens
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const message = typeof errorData.error === 'string'
      ? errorData.error
      : errorData.error?.message || `API error: ${response.status}`
    throw new Error(message)
  }

  const data = await response.json()
  return data.content[0].text
}

export async function streamHealthSG(messages, systemPrompt, maxTokens, onText) {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, systemPrompt, maxTokens })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const message = typeof errorData.error === 'string'
      ? errorData.error
      : errorData.error?.message || `API error: ${response.status}`
    throw new Error(message)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    // Parse SSE events from Anthropic's streaming format
    const lines = chunk.split('\n')
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') continue

      try {
        const parsed = JSON.parse(data)
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          fullText += parsed.delta.text
          onText(fullText)
        }
      } catch {
        // Skip non-JSON lines
      }
    }
  }

  return fullText
}
