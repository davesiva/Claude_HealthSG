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
