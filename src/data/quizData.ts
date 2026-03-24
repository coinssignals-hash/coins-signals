export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ModuleQuiz {
  moduleTitle: string;
  categoryId: string;
  questions: QuizQuestion[];
}

// Quizzes indexed by module title (matching coursesData module titles)
export const moduleQuizzes: Record<string, ModuleQuiz> = {
  'Introducción al trading': {
    moduleTitle: 'Introducción al trading',
    categoryId: 'inicio',
    questions: [
      { id: 'q1_1', question: '¿Qué es el trading?', options: ['Comprar y mantener acciones a largo plazo', 'Comprar y vender activos financieros buscando beneficio a corto/medio plazo', 'Solo invertir en criptomonedas', 'Ahorrar dinero en un banco'], correctIndex: 1, explanation: 'El trading consiste en la compra y venta de activos financieros en mercados, buscando obtener beneficios de las fluctuaciones de precio.' },
      { id: 'q1_2', question: '¿Cuál es la diferencia principal entre invertir y tradear?', options: ['No hay diferencia', 'El trading busca beneficios a corto plazo, la inversión a largo plazo', 'La inversión es más arriesgada', 'El trading solo se hace con acciones'], correctIndex: 1, explanation: 'Invertir implica mantener posiciones a largo plazo, mientras que el trading busca aprovechar movimientos de precio a corto y medio plazo.' },
      { id: 'q1_3', question: '¿Cuáles son los principales mercados financieros?', options: ['Solo Forex', 'Solo criptomonedas', 'Forex, acciones, futuros, commodities y criptomonedas', 'Solo bonos y acciones'], correctIndex: 2, explanation: 'Los principales mercados incluyen Forex, acciones, futuros, commodities (materias primas) y criptomonedas.' },
    ],
  },
  'Cómo funciona una operación': {
    moduleTitle: 'Cómo funciona una operación',
    categoryId: 'inicio',
    questions: [
      { id: 'q2_1', question: '¿Qué es una orden de tipo "market"?', options: ['Una orden que se ejecuta al precio actual del mercado', 'Una orden que espera a un precio específico', 'Una orden que se cancela automáticamente', 'Una orden solo para acciones'], correctIndex: 0, explanation: 'Una orden market se ejecuta inmediatamente al mejor precio disponible en el mercado.' },
      { id: 'q2_2', question: '¿Qué es el spread en trading?', options: ['La ganancia del trader', 'La diferencia entre el precio de compra y venta', 'Un tipo de indicador técnico', 'El margen requerido'], correctIndex: 1, explanation: 'El spread es la diferencia entre el precio bid (venta) y ask (compra), representando el costo de la operación.' },
      { id: 'q2_3', question: '¿Para qué sirve un stop loss?', options: ['Para maximizar ganancias', 'Para limitar las pérdidas en una operación', 'Para abrir operaciones automáticamente', 'Para calcular el apalancamiento'], correctIndex: 1, explanation: 'El stop loss es una orden que cierra automáticamente una posición cuando el precio alcanza un nivel de pérdida predefinido.' },
      { id: 'q2_4', question: '¿Qué significa operar "en corto"?', options: ['Operar por poco tiempo', 'Vender un activo que no posees esperando que baje de precio', 'Comprar con poco dinero', 'Operar solo en horario reducido'], correctIndex: 1, explanation: 'Operar en corto (short selling) significa vender un activo prestado con la expectativa de recomprarlo a un precio menor.' },
    ],
  },
  'Psicología del trader': {
    moduleTitle: 'Psicología del trader',
    categoryId: 'inicio',
    questions: [
      { id: 'qp_1', question: '¿Qué es el FOMO en trading?', options: ['Un indicador técnico', 'El miedo a perderse una oportunidad (Fear Of Missing Out)', 'Una estrategia de inversión', 'Un tipo de orden'], correctIndex: 1, explanation: 'FOMO es el miedo a perderse una oportunidad, que lleva a tomar decisiones impulsivas sin análisis adecuado.' },
      { id: 'qp_2', question: '¿Cuál es el error más común del trader principiante?', options: ['Usar stop loss', 'No tener un plan de trading y operar por emociones', 'Estudiar demasiado', 'Usar poco apalancamiento'], correctIndex: 1, explanation: 'Operar sin plan y dejarse llevar por emociones como el miedo y la codicia es el error más frecuente entre principiantes.' },
    ],
  },
  'Fundamentos del mercado Forex': {
    moduleTitle: 'Fundamentos del mercado Forex',
    categoryId: 'forex',
    questions: [
      { id: 'qfx1_1', question: '¿Qué es un par de divisas "major"?', options: ['Cualquier par de divisas', 'Un par que incluye el USD con otra divisa principal', 'Solo EUR/USD', 'Pares de países emergentes'], correctIndex: 1, explanation: 'Los pares majors incluyen el USD combinado con otras divisas principales como EUR, GBP, JPY, CHF, AUD, CAD, NZD.' },
      { id: 'qfx1_2', question: '¿Cuál es la sesión más volátil del mercado Forex?', options: ['Sesión de Tokyo', 'Sesión de Sídney', 'Superposición Londres-Nueva York', 'Fin de semana'], correctIndex: 2, explanation: 'La superposición de las sesiones de Londres y Nueva York (13:00-17:00 UTC) genera mayor volumen y volatilidad.' },
      { id: 'qfx1_3', question: '¿Qué son los pares exóticos?', options: ['Pares muy populares', 'Pares que combinan una divisa major con una de economía emergente', 'Pares de criptomonedas', 'Pares que solo se operan de noche'], correctIndex: 1, explanation: 'Los pares exóticos combinan una divisa principal con la de un país emergente, como USD/TRY o EUR/ZAR.' },
    ],
  },
  'Análisis técnico en Forex': {
    moduleTitle: 'Análisis técnico en Forex',
    categoryId: 'forex',
    questions: [
      { id: 'qfx2_1', question: '¿Qué indica un patrón de vela "martillo"?', options: ['Continuación bajista', 'Posible reversión alcista', 'Alta volatilidad sin dirección', 'Mercado cerrado'], correctIndex: 1, explanation: 'El martillo (hammer) es un patrón de reversión alcista que aparece en zonas de soporte tras una tendencia bajista.' },
      { id: 'qfx2_2', question: '¿Qué mide el indicador MACD?', options: ['El volumen del mercado', 'La convergencia/divergencia de medias móviles para identificar momentum', 'El precio máximo del día', 'La correlación entre pares'], correctIndex: 1, explanation: 'El MACD (Moving Average Convergence Divergence) mide el momentum comparando dos medias móviles exponenciales.' },
      { id: 'qfx2_3', question: '¿Para qué se usan los retrocesos de Fibonacci?', options: ['Para calcular el spread', 'Para identificar niveles potenciales de soporte y resistencia', 'Para medir el volumen', 'Para determinar el apalancamiento'], correctIndex: 1, explanation: 'Los retrocesos de Fibonacci (23.6%, 38.2%, 50%, 61.8%) identifican niveles donde el precio podría encontrar soporte o resistencia.' },
    ],
  },
  'Estrategias Forex avanzadas': {
    moduleTitle: 'Estrategias Forex avanzadas',
    categoryId: 'forex',
    questions: [
      { id: 'qfxp_1', question: '¿Cuál es la diferencia principal entre scalping y swing trading?', options: ['No hay diferencia', 'El scalping busca movimientos de minutos, el swing de días/semanas', 'El swing trading es más arriesgado', 'El scalping solo se hace con acciones'], correctIndex: 1, explanation: 'El scalping busca pequeños movimientos en minutos, mientras el swing trading mantiene posiciones de días a semanas.' },
      { id: 'qfxp_2', question: '¿Qué es el NFP y por qué es importante?', options: ['Un indicador técnico', 'Non-Farm Payrolls: dato de empleo de EE.UU. que genera alta volatilidad', 'Un tipo de orden especial', 'Una plataforma de trading'], correctIndex: 1, explanation: 'El NFP es el informe de nóminas no agrícolas de EE.UU., uno de los datos económicos que más impacto genera en el mercado Forex.' },
    ],
  },
  'Fundamentos de la Bolsa': {
    moduleTitle: 'Fundamentos de la Bolsa',
    categoryId: 'acciones',
    questions: [
      { id: 'qst1_1', question: '¿Qué representa una acción?', options: ['Un préstamo a una empresa', 'Una parte de la propiedad de una empresa', 'Un bono del gobierno', 'Una criptomoneda'], correctIndex: 1, explanation: 'Una acción representa una fracción de la propiedad (equity) de una empresa, dando derecho a voto y dividendos.' },
      { id: 'qst1_2', question: '¿Qué es el análisis fundamental de una empresa?', options: ['Analizar solo el gráfico de precios', 'Evaluar la salud financiera, ingresos, deuda y crecimiento', 'Ver las noticias del día', 'Copiar las operaciones de otros'], correctIndex: 1, explanation: 'El análisis fundamental evalúa el valor intrínseco de una empresa estudiando sus estados financieros, industria y perspectivas de crecimiento.' },
    ],
  },
  'Trading de acciones': {
    moduleTitle: 'Trading de acciones',
    categoryId: 'acciones',
    questions: [
      { id: 'qst2_1', question: '¿Qué es el ratio P/E?', options: ['Precio por Ethereum', 'Price to Earnings: precio de la acción dividido por las ganancias por acción', 'Un indicador técnico', 'El porcentaje de error'], correctIndex: 1, explanation: 'El P/E ratio indica cuántas veces las ganancias por acción se reflejan en su precio. Un P/E alto puede indicar sobrevaluación.' },
      { id: 'qst2_2', question: '¿Qué es la "earnings season"?', options: ['Una estación del año', 'El periodo donde las empresas publican sus resultados trimestrales', 'Una técnica de trading', 'Un evento solo en Europa'], correctIndex: 1, explanation: 'La earnings season es el periodo (generalmente enero, abril, julio, octubre) donde las empresas cotizadas reportan resultados trimestrales.' },
    ],
  },
  'Trading con materias primas': {
    moduleTitle: 'Trading con materias primas',
    categoryId: 'metales',
    questions: [
      { id: 'qmt_1', question: '¿Por qué el oro se considera un activo refugio?', options: ['Porque es brillante', 'Porque tiende a subir en tiempos de incertidumbre económica', 'Porque es muy barato', 'Porque solo se opera en horario nocturno'], correctIndex: 1, explanation: 'El oro es un activo refugio porque históricamente mantiene o aumenta su valor durante crisis económicas e incertidumbre global.' },
      { id: 'qmt_2', question: '¿Qué relación tiene generalmente el oro con el dólar?', options: ['Directa: suben juntos', 'Inversa: cuando el dólar sube, el oro tiende a bajar', 'No tienen relación', 'Solo se correlacionan en Forex'], correctIndex: 1, explanation: 'Generalmente existe una correlación inversa: un dólar fuerte tiende a presionar el precio del oro a la baja y viceversa.' },
    ],
  },
  'Fundamentos de criptomonedas': {
    moduleTitle: 'Fundamentos de criptomonedas',
    categoryId: 'criptomonedas',
    questions: [
      { id: 'qcr1_1', question: '¿Qué es el halving de Bitcoin?', options: ['Un fork del blockchain', 'La reducción a la mitad de la recompensa por bloque minado, cada ~4 años', 'El precio dividido a la mitad', 'Una actualización de software'], correctIndex: 1, explanation: 'El halving reduce la recompensa de minería a la mitad cada ~210,000 bloques (~4 años), disminuyendo la emisión de nuevos BTC.' },
      { id: 'qcr1_2', question: '¿Qué son los smart contracts?', options: ['Contratos legales en papel', 'Programas autoejecutables en blockchain que cumplen condiciones predefinidas', 'Contratos de trabajo', 'Solo existen en Bitcoin'], correctIndex: 1, explanation: 'Los smart contracts son programas almacenados en blockchain que se ejecutan automáticamente cuando se cumplen condiciones predefinidas.' },
      { id: 'qcr1_3', question: '¿Qué es una cold wallet?', options: ['Una wallet que no funciona', 'Un dispositivo de almacenamiento offline para criptomonedas', 'Una wallet con poco dinero', 'Una app del teléfono'], correctIndex: 1, explanation: 'Una cold wallet almacena las claves privadas sin conexión a internet, ofreciendo la máxima seguridad contra hackeos.' },
    ],
  },
  'Trading de criptomonedas': {
    moduleTitle: 'Trading de criptomonedas',
    categoryId: 'criptomonedas',
    questions: [
      { id: 'qcr2_1', question: '¿Qué es el análisis on-chain?', options: ['Analizar noticias', 'Estudiar datos directos del blockchain como transacciones y direcciones activas', 'Un tipo de gráfico', 'Analizar redes sociales'], correctIndex: 1, explanation: 'El análisis on-chain estudia métricas directas del blockchain como MVRV, HODLer waves y flujos de exchanges para evaluar el mercado.' },
    ],
  },
};
