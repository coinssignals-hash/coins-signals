interface Level {
  price: number;
  description: string;
}

interface TechnicalLevelsProps {
  resistances: Level[];
  supports: Level[];
  loading?: boolean;
}

export function TechnicalLevels({ resistances, supports, loading }: TechnicalLevelsProps) {
  if (loading) {
    return (
      <div className="bg-[#0a1a0a] border border-green-900/50 rounded-lg p-4 animate-pulse">
        <div className="h-40 bg-green-900/20 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a1a0a] border border-green-900/50 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4">Niveles Técnicos - Soportes y Resistencias</h3>
      
      <div className="space-y-4 text-sm">
        {/* Resistances */}
        <div>
          <h4 className="text-gray-400 mb-2">Resistencias Clave:</h4>
          <div className="space-y-1">
            {resistances.map((level, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-red-400 font-mono font-bold shrink-0">{level.price.toFixed(4)}</span>
                <span className="text-gray-400">-</span>
                <span className="text-gray-300">{level.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Supports */}
        <div>
          <h4 className="text-gray-400 mb-2">Soportes Clave:</h4>
          <div className="space-y-1">
            {supports.map((level, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-green-400 font-mono font-bold shrink-0">{level.price.toFixed(4)}</span>
                <span className="text-gray-400">-</span>
                <span className="text-gray-300">{level.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
