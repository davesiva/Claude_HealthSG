import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Send } from 'lucide-react'
import { askHealthSG } from '../utils/anthropic'
import { useHealthData } from '../context/HealthDataContext'
import timelineEvents from '../data/timeline-events.json'

function getSystemPrompt(healthData) {
  return `You are HealthSG's AI assistant, helping users understand Singapore's public health data. You have access to the following datasets from Singapore's Ministry of Health and data.gov.sg:

${JSON.stringify(healthData, null, 2)}

Timeline events:
${JSON.stringify(timelineEvents, null, 2)}

Rules:
- Only discuss Singapore health data and related public health topics
- Cite specific numbers from the data when answering
- If asked about something outside the data, say so honestly and suggest where they might find it
- Never provide personal medical advice — always recommend consulting a doctor
- Be concise: 3-5 sentences for simple questions, up to 2-3 short paragraphs for complex ones
- Tone: warm, informative, accessible to a general audience
- When relevant, mention Singapore-specific programmes (Healthier SG, CDMP, Screen for Life, War on Diabetes)`
}

const suggestedQuestions = [
  'How has diabetes changed over time?',
  "What's the leading cause of death?",
  "Tell me about Singapore's health spending",
  'How does smoking compare across decades?'
]

export default function AskHealthSG() {
  const { healthData } = useHealthData()
  const systemPrompt = useMemo(() => getSystemPrompt(healthData), [healthData])
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  async function sendMessage(text) {
    if (!text.trim() || isLoading) return

    const userMsg = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }))
      const response = await askHealthSG(apiMessages, systemPrompt)
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please check your API key and try again.' }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <>
      {/* FAB */}
      <motion.button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center shadow-lg z-40 cursor-pointer"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ boxShadow: ['0 4px 14px rgba(13,148,136,0.3)', '0 4px 20px rgba(13,148,136,0.5)', '0 4px 14px rgba(13,148,136,0.3)'] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ display: isOpen ? 'none' : 'flex' }}
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/20 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              className="fixed z-50 bg-card rounded-t-2xl md:rounded-2xl shadow-xl flex flex-col
                bottom-0 left-0 right-0 h-[80vh]
                md:bottom-6 md:right-6 md:left-auto md:w-[400px] md:h-[600px]"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h3 className="font-heading text-lg text-primary">Ask HealthSG</h3>
                  <p className="text-[10px] text-secondary/50">Powered by Claude AI · Not medical advice</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-grid transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-secondary" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {messages.length === 0 && !isLoading && (
                  <div className="space-y-2">
                    <p className="text-sm text-secondary mb-3">Try asking:</p>
                    {suggestedQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(q)}
                        className="block w-full text-left px-4 py-2.5 rounded-xl bg-grid text-sm text-primary hover:bg-border/50 transition-colors cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-accent text-white rounded-br-sm'
                          : 'bg-grid text-primary rounded-bl-sm'
                      }`}
                    >
                      {msg.content.split('\n\n').map((para, j) => (
                        <p key={j} className={j > 0 ? 'mt-2' : ''}>{para}</p>
                      ))}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-grid px-4 py-3 rounded-2xl rounded-bl-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-secondary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-secondary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-secondary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-border flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about Singapore's health data..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-grid text-sm text-primary placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-accent text-white disabled:opacity-40 cursor-pointer transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
