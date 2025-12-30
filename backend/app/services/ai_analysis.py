"""
AI Analysis Service using OpenAI
Generates market analysis, predictions, and recommendations using GPT models
"""

import os
import json
from typing import Dict, Any, Optional, List
from datetime import datetime
import httpx
from app.config import get_settings

class AIAnalysisService:
    """Service for generating AI-powered market analysis"""
    
    SYSTEM_PROMPTS = {
        "sentiment": """Eres un analista de mercados financieros experto. Analiza el sentimiento del mercado para el par de divisas proporcionado.
Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "overall": "bullish" | "bearish" | "neutral",
  "score": número entre -1 y 1,
  "retail_sentiment": número entre 0 y 1,
  "institutional_sentiment": número entre 0 y 1,
  "news_sentiment": número entre 0 y 1,
  "technical_sentiment": número entre 0 y 1,
  "reasoning": "breve explicación"
}""",

        "prediction": """Eres un analista técnico experto en forex. Genera una predicción de precio basada en los datos proporcionados.
Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "direction": "up" | "down" | "sideways",
  "target_price": número,
  "confidence": número entre 0 y 1,
  "timeframe": "1-3 days" | "1 week" | "2 weeks" | "1 month",
  "support_levels": [array de 3 números],
  "resistance_levels": [array de 3 números],
  "reasoning": "breve explicación"
}""",

        "conclusions": """Eres un estratega de mercados financieros. Genera conclusiones y perspectivas de mercado.
Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "summary": "resumen de 2-3 oraciones",
  "key_drivers": ["array de 3-5 factores principales"],
  "risks": ["array de 3-5 riesgos"],
  "opportunities": ["array de 3-5 oportunidades"],
  "outlook": "perspectiva general en una oración"
}""",

        "recommendations": """Eres un asesor de trading profesional. Genera recomendaciones estratégicas de trading.
Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "short_term": {
    "action": "buy" | "sell" | "hold",
    "entry_price": número,
    "stop_loss": número,
    "take_profit": número,
    "risk_reward": número,
    "confidence": número entre 0 y 1,
    "timeframe": "1-3 days",
    "reasoning": "explicación breve"
  },
  "medium_term": { mismo formato con timeframe "1-2 weeks" },
  "long_term": { mismo formato con timeframe "1-3 months" }
}"""
    }

    def __init__(self):
        self.settings = get_settings()
        self.api_key = self.settings.openai_api_key
        self.base_url = "https://api.openai.com/v1/chat/completions"
        self.model = "gpt-4o-mini"  # Cost-effective model for analysis
    
    def _build_context(
        self,
        symbol: str,
        market_data: Optional[Dict[str, Any]] = None,
        technical_indicators: Optional[Dict[str, Any]] = None,
        news_context: Optional[List[str]] = None
    ) -> str:
        """Build context message for the AI"""
        message = f"Analiza el par {symbol}.\n\n"
        
        if market_data:
            current = market_data.get("current_price", 0)
            previous = market_data.get("previous_close", current)
            change = ((current - previous) / previous * 100) if previous else 0
            
            message += f"""Datos de mercado actuales:
- Precio actual: {current}
- Cierre anterior: {previous}
- Máximo: {market_data.get("high", "N/A")}
- Mínimo: {market_data.get("low", "N/A")}
- Cambio: {change:.2f}%

"""
        
        if technical_indicators:
            message += "Indicadores técnicos:\n"
            if "rsi" in technical_indicators:
                message += f"- RSI(14): {technical_indicators['rsi']}\n"
            if "macd" in technical_indicators:
                macd = technical_indicators["macd"]
                message += f"- MACD: {macd.get('value', 0):.5f} (Signal: {macd.get('signal', 0):.5f})\n"
            if "sma20" in technical_indicators:
                message += f"- SMA(20): {technical_indicators['sma20']}\n"
            if "sma50" in technical_indicators:
                message += f"- SMA(50): {technical_indicators['sma50']}\n"
            message += "\n"
        
        if news_context:
            message += "Contexto de noticias recientes:\n"
            for i, news in enumerate(news_context, 1):
                message += f"{i}. {news}\n"
            message += "\n"
        
        return message

    async def analyze(
        self,
        analysis_type: str,
        symbol: str,
        market_data: Optional[Dict[str, Any]] = None,
        technical_indicators: Optional[Dict[str, Any]] = None,
        news_context: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate AI-powered analysis for a symbol
        
        Args:
            analysis_type: Type of analysis (sentiment, prediction, conclusions, recommendations)
            symbol: Trading pair symbol (e.g., "EUR/USD")
            market_data: Current market data
            technical_indicators: Technical indicators data
            news_context: List of relevant news headlines
            
        Returns:
            Dictionary containing the analysis results
        """
        if not self.api_key:
            return {
                "error": "OpenAI API key not configured",
                "fallback": True,
                "type": analysis_type,
                "symbol": symbol
            }
        
        system_prompt = self.SYSTEM_PROMPTS.get(analysis_type)
        if not system_prompt:
            return {"error": f"Invalid analysis type: {analysis_type}"}
        
        user_message = self._build_context(symbol, market_data, technical_indicators, news_context)
        user_message += f"Genera el análisis de tipo \"{analysis_type}\" para {symbol}."
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_message}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 1000
                    }
                )
                
                if response.status_code != 200:
                    error_text = response.text
                    print(f"OpenAI API error: {response.status_code} - {error_text}")
                    return {"error": f"API error: {response.status_code}"}
                
                data = response.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                
                # Parse JSON from response
                try:
                    # Extract JSON from markdown code blocks if present
                    import re
                    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', content)
                    json_str = json_match.group(1).strip() if json_match else content.strip()
                    analysis_result = json.loads(json_str)
                except json.JSONDecodeError:
                    print(f"Failed to parse AI response: {content}")
                    analysis_result = {"raw_response": content}
                
                return {
                    "type": analysis_type,
                    "symbol": symbol,
                    "analysis": analysis_result,
                    "generated_at": datetime.now().isoformat(),
                    "model": self.model
                }
                
        except Exception as e:
            print(f"AI Analysis error: {e}")
            return {"error": str(e)}

    async def get_sentiment(self, symbol: str, **kwargs) -> Dict[str, Any]:
        """Get AI-generated sentiment analysis"""
        return await self.analyze("sentiment", symbol, **kwargs)
    
    async def get_prediction(self, symbol: str, **kwargs) -> Dict[str, Any]:
        """Get AI-generated price prediction"""
        return await self.analyze("prediction", symbol, **kwargs)
    
    async def get_conclusions(self, symbol: str, **kwargs) -> Dict[str, Any]:
        """Get AI-generated market conclusions"""
        return await self.analyze("conclusions", symbol, **kwargs)
    
    async def get_recommendations(self, symbol: str, **kwargs) -> Dict[str, Any]:
        """Get AI-generated trading recommendations"""
        return await self.analyze("recommendations", symbol, **kwargs)


# Singleton instance
ai_service = AIAnalysisService()
