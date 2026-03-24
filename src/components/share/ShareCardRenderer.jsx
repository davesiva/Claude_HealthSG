import { forwardRef } from 'react'

// 1200x630 social-optimized card rendered off-screen, captured by html-to-image
const ShareCardRenderer = forwardRef(function ShareCardRenderer({ title, subtitle, children }, ref) {
  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 0,
        width: 1200,
        height: 630,
        backgroundColor: '#FAFAF8',
        fontFamily: '"DM Sans", sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 5, background: 'linear-gradient(90deg, #0D9488, #14B8A6)' }} />

      {/* Header */}
      <div style={{ padding: '28px 48px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{
            fontFamily: '"Instrument Serif", serif',
            fontSize: 22,
            color: '#1A1A1A',
            letterSpacing: '-0.02em',
          }}>
            Middle Out
          </span>
          <span style={{
            fontSize: 13,
            color: '#9CA3AF',
            fontFamily: '"JetBrains Mono", monospace',
          }}>
            Singapore Health Data
          </span>
        </div>
        <h2 style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 32,
          color: '#1A1A1A',
          margin: 0,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{
            fontSize: 15,
            color: '#6B7280',
            marginTop: 6,
            marginBottom: 0,
          }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Chart area */}
      <div style={{ padding: '16px 48px 0', height: 380 }}>
        {children}
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '12px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #E5E7EB',
      }}>
        <span style={{
          fontSize: 12,
          color: '#9CA3AF',
          fontFamily: '"JetBrains Mono", monospace',
        }}>
          middleout.sg
        </span>
        <span style={{
          fontSize: 11,
          color: '#D1D5DB',
          fontFamily: '"JetBrains Mono", monospace',
        }}>
          Data: SingStat, MOH, OWID
        </span>
      </div>
    </div>
  )
})

export default ShareCardRenderer
