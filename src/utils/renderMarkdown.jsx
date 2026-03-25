/**
 * Renders basic markdown (bold, italic) in AI-generated text.
 * Splits text into paragraphs and applies inline formatting.
 * Supports severity tags [GREEN], [AMBER], [RED] for color-coded insight blocks.
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

const SEVERITY_STYLES = {
  GREEN: 'border-l-4 border-green-500 bg-green-50/50 pl-4 py-2 rounded-r-lg',
  AMBER: 'border-l-4 border-amber-500 bg-amber-50/50 pl-4 py-2 rounded-r-lg',
  RED:   'border-l-4 border-red-500 bg-red-50/50 pl-4 py-2 rounded-r-lg',
}

const SEVERITY_TAG_RE = /^\[(GREEN|AMBER|RED)\]\s*/

function parseSeverity(para) {
  const match = para.match(SEVERITY_TAG_RE)
  if (match) {
    return { severity: match[1], text: para.slice(match[0].length) }
  }
  return { severity: null, text: para }
}

export function renderMarkdownParagraphs(text) {
  if (!text) return null
  return text.split('\n\n').map((para, i) => {
    const { severity, text: cleanText } = parseSeverity(para.trim())
    const className = severity
      ? SEVERITY_STYLES[severity]
      : (i > 0 ? 'mt-2' : '')
    return (
      <p key={i} className={className}>
        {renderInline(cleanText)}
      </p>
    )
  })
}
