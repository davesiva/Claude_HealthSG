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
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content[0].text
}
