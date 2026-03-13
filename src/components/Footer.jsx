export default function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="max-w-[960px] mx-auto text-center space-y-3">
        <p className="text-sm text-secondary">
          Built with open data from{' '}
          <a href="https://tablebuilder.singstat.gov.sg" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
            SingStat Table Builder
          </a>
          {' & '}
          <a href="https://data.gov.sg" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
            data.gov.sg
          </a>
        </p>
        <p className="text-xs text-secondary/70">
          Sources: Ministry of Health, Department of Statistics Singapore (SingStat), NEA, Health Promotion Board
        </p>
        <p className="text-xs text-secondary/70">
          AI insights powered by Claude (Anthropic)
        </p>
        <p className="text-xs text-secondary/60 mt-4">
          Not medical advice. Always consult a qualified healthcare professional.
        </p>
        <p className="text-xs text-secondary/50 mt-2">&copy; 2026 HealthSG</p>
      </div>
    </footer>
  )
}
