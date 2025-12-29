import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface WeeklySummaryProps {
  weekNumber: number;
  totalSignals: number;
  successfulSignals: number;
  lostSignals: number;
  pipsGained: number;
  pipsLost: number;
  successRate: number;
}

export function WeeklySummary({
  weekNumber,
  totalSignals,
  successfulSignals,
  lostSignals,
  pipsGained,
  pipsLost,
  successRate,
}: WeeklySummaryProps) {
  const pieData = [
    { name: 'Exitoso', value: successRate, color: '#22c55e' },
    { name: 'Perdido', value: 100 - successRate, color: '#ef4444' },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-foreground mb-4">Resumen Semana {weekNumber}</h2>
      
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between gap-2">
          {/* Total Signals */}
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Total Señales</span>
            <span className="text-4xl font-bold text-amber-400 font-mono-numbers">{totalSignals}</span>
            <span className="text-xs text-muted-foreground">Semana {weekNumber}</span>
          </div>

          {/* Successful Signals */}
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground text-center">Total Señales<br />Exitosas</span>
            <span className="text-3xl font-bold text-green-500 font-mono-numbers">{successfulSignals.toString().padStart(2, '0')}</span>
            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground">Pips Ganados</span>
              <span className="text-lg font-bold text-green-500 font-mono-numbers">+{pipsGained}</span>
            </div>
          </div>

          {/* Lost Signals */}
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground text-center">Total Señales<br />Perdidas</span>
            <span className="text-3xl font-bold text-red-500 font-mono-numbers">{lostSignals.toString().padStart(2, '0')}</span>
            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground">Pips Perdidas</span>
              <span className="text-lg font-bold text-red-500 font-mono-numbers">{pipsLost}</span>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={35}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-[10px] text-foreground font-bold text-center">
                  <span className="text-green-500">{successRate}%</span>
                  <span className="text-red-500 ml-1">{100 - successRate}%</span>
                </div>
              </div>
            </div>
            <div className="text-center mt-1">
              <span className="text-lg font-bold text-foreground">{successRate} %</span>
              <p className="text-xs text-muted-foreground">Exitoso</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
