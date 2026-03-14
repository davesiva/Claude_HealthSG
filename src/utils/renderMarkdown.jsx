/**
 * Renders basic markdown (bold, italic) in AI-generated text.
 * Splits text into paragraphs and applies inline formatting.
 */
function renderInline(text) {
  // Split on **bold** and *italic* patterns
  const parts = []
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    if (match[2]) {
      // **bold**
      parts.push(<strong key={match.index}>{match[2]}</strong>)
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={match.index}>{match[3]}</em>)
    }
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length ? parts : text
}

export function renderMarkdownParagraphs(text) {
  if (!text) return null
  return text.split('\n\n').map((para, i) => (
    <p key={i} className={i > 0 ? 'mt-2' : ''}>
      {renderInline(para)}
    </p>
  ))
}
