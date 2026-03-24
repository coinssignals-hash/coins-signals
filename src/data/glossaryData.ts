export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  example?: string;
}

export const glossaryCategories = [
  { id: 'basico', name: 'Básico', color: '217 91% 60%' },
  { id: 'tecnico', name: 'Análisis Técnico', color: '190 80% 55%' },
  { id: 'fundamental', name: 'Fundamental', color: '140 60% 50%' },
  { id: 'riesgo', name: 'Gestión de Riesgo', color: '40 80% 55%' },
  { id: 'cripto', name: 'Cripto', color: '270 60% 60%' },
  { id: 'ordenes', name: 'Órdenes', color: '340 70% 55%' },
];

export const glossaryTerms: GlossaryTerm[] = [
  // Básico
  { id: 'g1', term: 'Pip', definition: 'Unidad mínima de cambio en el precio de un par de divisas. En la mayoría de pares equivale a 0.0001.', category: 'basico', example: 'Si EUR/USD pasa de 1.1050 a 1.1051, se movió 1 pip.' },
  { id: 'g2', term: 'Lote', definition: 'Unidad estándar de medida para una operación. Un lote estándar equivale a 100,000 unidades de la divisa base.', category: 'basico', example: '1 lote estándar en EUR/USD = 100,000 EUR. Mini lote = 10,000, Micro lote = 1,000.' },
  { id: 'g3', term: 'Spread', definition: 'Diferencia entre el precio de compra (ask) y venta (bid) de un activo. Es el costo implícito de operar.', category: 'basico', example: 'Si bid = 1.1050 y ask = 1.1052, el spread es 2 pips.' },
  { id: 'g4', term: 'Apalancamiento', definition: 'Mecanismo que permite operar con más capital del que se posee, amplificando tanto ganancias como pérdidas.', category: 'basico', example: 'Con apalancamiento 1:100, con $1,000 puedes controlar $100,000.' },
  { id: 'g5', term: 'Margen', definition: 'Capital requerido como garantía para mantener una posición apalancada abierta.', category: 'basico', example: 'Con apalancamiento 1:100, necesitas $1,000 de margen para una posición de $100,000.' },
  { id: 'g6', term: 'Swap', definition: 'Interés que se cobra o paga por mantener una posición abierta durante la noche (overnight).', category: 'basico', example: 'Si compras AUD/JPY puedes recibir swap positivo por el diferencial de tasas de interés.' },
  { id: 'g7', term: 'Volatilidad', definition: 'Medida de la variación del precio de un activo en un periodo de tiempo. Alta volatilidad = grandes movimientos.', category: 'basico', example: 'Bitcoin tiene mayor volatilidad que EUR/USD, con movimientos diarios de 2-5%.' },
  { id: 'g8', term: 'Liquidez', definition: 'Facilidad con la que un activo puede ser comprado o vendido sin afectar significativamente su precio.', category: 'basico', example: 'EUR/USD es el par más líquido del mundo con volumen diario de ~$6 billones.' },
  { id: 'g9', term: 'Bull Market', definition: 'Mercado alcista donde los precios suben de forma sostenida. Los "bulls" (toros) son optimistas.', category: 'basico' },
  { id: 'g10', term: 'Bear Market', definition: 'Mercado bajista donde los precios caen de forma sostenida. Los "bears" (osos) son pesimistas.', category: 'basico' },
  { id: 'g11', term: 'Drawdown', definition: 'Caída máxima desde un pico de capital hasta el punto más bajo antes de una nueva recuperación.', category: 'basico', example: 'Si tu cuenta pasa de $10,000 a $8,000, tu drawdown es del 20%.' },

  // Análisis Técnico
  { id: 'g20', term: 'Soporte', definition: 'Nivel de precio donde la demanda es lo suficientemente fuerte como para detener una caída.', category: 'tecnico', example: 'Si EUR/USD rebota repetidamente en 1.0800, ese es un nivel de soporte.' },
  { id: 'g21', term: 'Resistencia', definition: 'Nivel de precio donde la oferta es suficiente para detener una subida.', category: 'tecnico', example: 'Si GBP/USD no logra superar 1.2700 varias veces, es una resistencia.' },
  { id: 'g22', term: 'Media Móvil (MA)', definition: 'Indicador que calcula el promedio del precio en un número determinado de periodos para suavizar el ruido.', category: 'tecnico', example: 'La SMA de 200 periodos se usa comúnmente para identificar la tendencia general.' },
  { id: 'g23', term: 'RSI', definition: 'Relative Strength Index: oscilador que mide la velocidad y magnitud de los cambios de precio. Rango 0-100.', category: 'tecnico', example: 'RSI > 70 indica sobrecompra, RSI < 30 indica sobreventa.' },
  { id: 'g24', term: 'MACD', definition: 'Moving Average Convergence Divergence: indicador de momentum que muestra la relación entre dos medias móviles.', category: 'tecnico' },
  { id: 'g25', term: 'Bandas de Bollinger', definition: 'Indicador que crea un canal alrededor de la media móvil usando desviaciones estándar para medir volatilidad.', category: 'tecnico' },
  { id: 'g26', term: 'Fibonacci', definition: 'Herramienta basada en la secuencia de Fibonacci para identificar niveles de retroceso y extensión del precio.', category: 'tecnico', example: 'Los niveles clave son 23.6%, 38.2%, 50%, 61.8% y 78.6%.' },
  { id: 'g27', term: 'Vela Japonesa', definition: 'Representación gráfica del precio que muestra apertura, cierre, máximo y mínimo en un periodo determinado.', category: 'tecnico' },
  { id: 'g28', term: 'Patrón Doble Techo', definition: 'Patrón de reversión bajista formado por dos máximos al mismo nivel con un valle intermedio.', category: 'tecnico' },
  { id: 'g29', term: 'Divergencia', definition: 'Discrepancia entre el movimiento del precio y un indicador, señalando posible cambio de tendencia.', category: 'tecnico', example: 'Si el precio hace nuevos máximos pero el RSI no, hay divergencia bajista.' },

  // Fundamental
  { id: 'g30', term: 'PIB', definition: 'Producto Interno Bruto: medida del valor total de bienes y servicios producidos por un país.', category: 'fundamental' },
  { id: 'g31', term: 'Tasa de Interés', definition: 'Porcentaje que cobra un banco central por prestar dinero. Afecta directamente al valor de las divisas.', category: 'fundamental', example: 'Cuando la Fed sube tasas, el USD tiende a fortalecerse.' },
  { id: 'g32', term: 'Inflación', definition: 'Aumento generalizado y sostenido de los precios de bienes y servicios en una economía.', category: 'fundamental' },
  { id: 'g33', term: 'NFP (Non-Farm Payrolls)', definition: 'Informe mensual de empleo no agrícola de EE.UU. Uno de los datos económicos más impactantes en Forex.', category: 'fundamental' },
  { id: 'g34', term: 'Hawkish', definition: 'Postura de un banco central favorable a subir tasas de interés para controlar la inflación.', category: 'fundamental' },
  { id: 'g35', term: 'Dovish', definition: 'Postura de un banco central favorable a mantener o bajar tasas para estimular la economía.', category: 'fundamental' },
  { id: 'g36', term: 'P/E Ratio', definition: 'Price to Earnings: ratio que divide el precio de una acción entre sus ganancias por acción. Mide la valoración.', category: 'fundamental', example: 'Un P/E de 20 significa que pagas $20 por cada $1 de ganancias.' },

  // Gestión de Riesgo
  { id: 'g40', term: 'Stop Loss', definition: 'Orden automática que cierra una posición cuando el precio alcanza un nivel de pérdida predefinido.', category: 'riesgo' },
  { id: 'g41', term: 'Take Profit', definition: 'Orden automática que cierra una posición cuando el precio alcanza un nivel de ganancia predefinido.', category: 'riesgo' },
  { id: 'g42', term: 'Risk/Reward Ratio', definition: 'Relación entre el riesgo asumido y la ganancia potencial de una operación.', category: 'riesgo', example: 'Un R:R de 1:3 significa que arriesgas $100 para ganar $300.' },
  { id: 'g43', term: 'Position Sizing', definition: 'Cálculo del tamaño óptimo de una posición basado en tu capital y tolerancia al riesgo.', category: 'riesgo', example: 'Regla del 1-2%: no arriesgar más del 1-2% de tu capital en una sola operación.' },
  { id: 'g44', term: 'Trailing Stop', definition: 'Stop loss dinámico que se mueve automáticamente a medida que el precio avanza a tu favor.', category: 'riesgo' },
  { id: 'g45', term: 'Margin Call', definition: 'Aviso del broker cuando tu margen disponible cae por debajo del mínimo requerido para mantener posiciones.', category: 'riesgo' },

  // Cripto
  { id: 'g50', term: 'Blockchain', definition: 'Registro descentralizado e inmutable de transacciones organizado en bloques enlazados criptográficamente.', category: 'cripto' },
  { id: 'g51', term: 'Halving', definition: 'Evento que reduce a la mitad la recompensa de minería de Bitcoin cada ~210,000 bloques (~4 años).', category: 'cripto' },
  { id: 'g52', term: 'DeFi', definition: 'Finanzas Descentralizadas: ecosistema de servicios financieros construidos sobre blockchain sin intermediarios.', category: 'cripto' },
  { id: 'g53', term: 'Gas Fee', definition: 'Comisión pagada por ejecutar transacciones o smart contracts en redes como Ethereum.', category: 'cripto' },
  { id: 'g54', term: 'HODL', definition: 'Término cripto que significa mantener (hold) una posición a largo plazo sin vender ante la volatilidad.', category: 'cripto' },
  { id: 'g55', term: 'Tokenomics', definition: 'Modelo económico de un token: distribución, emisión, utilidad, quema y mecanismos de incentivo.', category: 'cripto' },

  // Órdenes
  { id: 'g60', term: 'Orden Market', definition: 'Orden que se ejecuta inmediatamente al mejor precio disponible en el mercado.', category: 'ordenes' },
  { id: 'g61', term: 'Orden Limit', definition: 'Orden que se ejecuta solo cuando el precio alcanza un nivel específico o mejor.', category: 'ordenes', example: 'Buy Limit en 1.0800 se ejecuta cuando el precio baja a 1.0800 o menos.' },
  { id: 'g62', term: 'Orden Stop', definition: 'Orden que se activa cuando el precio alcanza un nivel específico, convirtiéndose en orden market.', category: 'ordenes' },
  { id: 'g63', term: 'Buy Stop', definition: 'Orden de compra que se activa cuando el precio sube a un nivel superior al actual.', category: 'ordenes' },
  { id: 'g64', term: 'Sell Stop', definition: 'Orden de venta que se activa cuando el precio baja a un nivel inferior al actual.', category: 'ordenes' },
];
