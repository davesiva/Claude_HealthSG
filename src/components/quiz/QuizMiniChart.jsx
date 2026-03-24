import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip
} from 'recharts'

const axisTick = { fontSize: 11, fill: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }
const axisStroke = '#D1D5DB'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-sm text-xs font-mono">
      <p className="text-secondary">{label}</p>
      <p className="text-primary font-semibold">{payload[0].value}</p>
    </div>
  )
}

export default function QuizMiniChart({ data, chartType = 'line', unit = '' }) {
  if (!data || data.length === 0) return null

  const chartData = data.map(d => ({ year: d.year, value: d.value }))

  return (
    <div className="w-full h-40 mt-3">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'bar' ? (
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="year" tick={axisTick} stroke={axisStroke} />
            <YAxis tick={axisTick} stroke={axisStroke} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="#0D9488" radius={[3, 3, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="year" tick={axisTick} stroke={axisStroke} />
            <YAxis tick={axisTick} stroke={axisStroke} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0D9488"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#0D9488' }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
