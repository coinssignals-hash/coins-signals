"""
Market Analysis API Router
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

router = APIRouter()

# Models
class SentimentData(BaseModel):
    overall: str  # bullish, bearish, neutral
    score: float
    retail_sentiment: float
    institutional_sentiment: float
    news_sentiment: float
    technical_sentiment: float

class PredictionData(BaseModel):
    direction: str  # up, down, sideways
    target_price: float
    confidence: float
    timeframe: str
    support_levels: List[float]
    resistance_levels: List[float]

class TechnicalLevel(BaseModel):
    price: float
    type: str  # support, resistance
    strength: str  # strong, moderate, weak
    touches: int

class TechnicalLevels(BaseModel):
    supports: List[TechnicalLevel]
    resistances: List[TechnicalLevel]
    pivot_point: float
    fibonacci_levels: dict

class PreviousDayData(BaseModel):
    open: float
    high: float
    low: float
    close: float
    volume: float
    change_percent: float
    range_pips: float

class Recommendation(BaseModel):
    action: str  # buy, sell, hold
    entry_price: float
    stop_loss: float
    take_profit: float
    risk_reward: float
    confidence: float
    timeframe: str
    reasoning: str

class StrategicRecommendations(BaseModel):
    short_term: Recommendation
    medium_term: Recommendation
    long_term: Recommendation

class MarketConclusions(BaseModel):
    summary: str
    key_drivers: List[str]
    risks: List[str]
    opportunities: List[str]
    outlook: str

class MonetaryPolicy(BaseModel):
    currency: str
    central_bank: str
    current_rate: float
    next_meeting: str
    expected_action: str
    policy_stance: str
    recent_statements: List[str]

class NewsItem(BaseModel):
    id: str
    title: str
    summary: str
    source: str
    published_at: str
    impact: str
    image_url: Optional[str] = None

class EconomicEvent(BaseModel):
    id: str
    name: str
    currency: str
    datetime: str
    impact: str  # high, medium, low
    actual: Optional[str] = None
    forecast: Optional[str] = None
    previous: Optional[str] = None

class FullAnalysis(BaseModel):
    symbol: str
    updated_at: str
    sentiment: SentimentData
    prediction: PredictionData
    technical_levels: TechnicalLevels
    previous_day: PreviousDayData
    recommendations: StrategicRecommendations
    conclusions: MarketConclusions
    monetary_policies: List[MonetaryPolicy]
    major_news: List[NewsItem]
    relevant_news: List[NewsItem]

# Sample data generator
def get_sample_analysis(symbol: str) -> dict:
    base_price = 1.0850 if "EUR" in symbol else 150.50 if "JPY" in symbol else 1.2650
    
    return {
        "symbol": symbol,
        "updated_at": datetime.now().isoformat(),
        "sentiment": {
            "overall": "bullish",
            "score": 0.65,
            "retail_sentiment": 0.55,
            "institutional_sentiment": 0.72,
            "news_sentiment": 0.60,
            "technical_sentiment": 0.68
        },
        "prediction": {
            "direction": "up",
            "target_price": base_price * 1.02,
            "confidence": 0.72,
            "timeframe": "1 week",
            "support_levels": [base_price * 0.99, base_price * 0.98, base_price * 0.97],
            "resistance_levels": [base_price * 1.01, base_price * 1.02, base_price * 1.03]
        },
        "technical_levels": {
            "supports": [
                {"price": base_price * 0.995, "type": "support", "strength": "strong", "touches": 3},
                {"price": base_price * 0.990, "type": "support", "strength": "moderate", "touches": 2}
            ],
            "resistances": [
                {"price": base_price * 1.005, "type": "resistance", "strength": "strong", "touches": 4},
                {"price": base_price * 1.010, "type": "resistance", "strength": "moderate", "touches": 2}
            ],
            "pivot_point": base_price,
            "fibonacci_levels": {
                "0.0": base_price * 0.97,
                "0.236": base_price * 0.985,
                "0.382": base_price * 0.99,
                "0.5": base_price,
                "0.618": base_price * 1.01,
                "1.0": base_price * 1.03
            }
        },
        "previous_day": {
            "open": base_price * 0.998,
            "high": base_price * 1.005,
            "low": base_price * 0.995,
            "close": base_price,
            "volume": 125000,
            "change_percent": 0.15,
            "range_pips": 100
        },
        "recommendations": {
            "short_term": {
                "action": "buy",
                "entry_price": base_price,
                "stop_loss": base_price * 0.995,
                "take_profit": base_price * 1.015,
                "risk_reward": 3.0,
                "confidence": 0.70,
                "timeframe": "1-3 days",
                "reasoning": "Technical breakout above key resistance with strong momentum"
            },
            "medium_term": {
                "action": "buy",
                "entry_price": base_price * 0.99,
                "stop_loss": base_price * 0.97,
                "take_profit": base_price * 1.03,
                "risk_reward": 2.0,
                "confidence": 0.65,
                "timeframe": "1-2 weeks",
                "reasoning": "Fundamental outlook supports continued strength"
            },
            "long_term": {
                "action": "hold",
                "entry_price": base_price,
                "stop_loss": base_price * 0.95,
                "take_profit": base_price * 1.05,
                "risk_reward": 1.0,
                "confidence": 0.55,
                "timeframe": "1-3 months",
                "reasoning": "Wait for clearer directional signals from central banks"
            }
        },
        "conclusions": {
            "summary": f"El par {symbol} muestra una tendencia alcista moderada con soporte técnico sólido.",
            "key_drivers": [
                "Política monetaria divergente entre bancos centrales",
                "Datos económicos favorables",
                "Sentimiento de mercado positivo"
            ],
            "risks": [
                "Volatilidad por datos de inflación",
                "Cambios inesperados en política monetaria",
                "Tensiones geopolíticas"
            ],
            "opportunities": [
                "Retrocesos hacia niveles de soporte",
                "Ruptura de resistencias clave",
                "Momentum técnico favorable"
            ],
            "outlook": "Moderadamente alcista para las próximas semanas"
        },
        "monetary_policies": get_monetary_policies(symbol),
        "major_news": [
            {
                "id": "mn1",
                "title": "Fed Minutes Show Cautious Approach to Rate Cuts",
                "summary": "Federal Reserve officials expressed caution about cutting rates too quickly.",
                "source": "Reuters",
                "published_at": datetime.now().isoformat(),
                "impact": "high",
                "image_url": None
            }
        ],
        "relevant_news": [
            {
                "id": "rn1",
                "title": "Economic Growth Exceeds Expectations",
                "summary": "GDP growth came in above forecasts, supporting the currency.",
                "source": "Bloomberg",
                "published_at": datetime.now().isoformat(),
                "impact": "medium",
                "image_url": None
            }
        ]
    }

def get_monetary_policies(symbol: str) -> List[dict]:
    policies = []
    currencies = symbol.replace("/", "").upper()
    
    if "EUR" in currencies:
        policies.append({
            "currency": "EUR",
            "central_bank": "European Central Bank (ECB)",
            "current_rate": 4.50,
            "next_meeting": "2025-01-25",
            "expected_action": "Hold",
            "policy_stance": "Hawkish",
            "recent_statements": [
                "Inflation remains above target",
                "Ready to adjust policy if needed"
            ]
        })
    
    if "USD" in currencies:
        policies.append({
            "currency": "USD",
            "central_bank": "Federal Reserve (Fed)",
            "current_rate": 5.50,
            "next_meeting": "2025-01-29",
            "expected_action": "Hold",
            "policy_stance": "Data-dependent",
            "recent_statements": [
                "No rush to cut rates",
                "Monitoring inflation closely"
            ]
        })
    
    if "GBP" in currencies:
        policies.append({
            "currency": "GBP",
            "central_bank": "Bank of England (BoE)",
            "current_rate": 5.25,
            "next_meeting": "2025-02-06",
            "expected_action": "Hold",
            "policy_stance": "Cautious",
            "recent_statements": [
                "Inflation still too high",
                "Rates to stay restrictive"
            ]
        })
    
    if "JPY" in currencies:
        policies.append({
            "currency": "JPY",
            "central_bank": "Bank of Japan (BoJ)",
            "current_rate": 0.25,
            "next_meeting": "2025-01-24",
            "expected_action": "Hold",
            "policy_stance": "Dovish",
            "recent_statements": [
                "Monitoring wage growth",
                "Gradual normalization expected"
            ]
        })
    
    return policies

def get_economic_events(symbol: str, date_str: str) -> List[dict]:
    currencies = symbol.replace("/", "").upper()
    events = []
    
    if "USD" in currencies:
        events.extend([
            {
                "id": "ev1",
                "name": "Non-Farm Payrolls",
                "currency": "USD",
                "datetime": f"{date_str}T13:30:00Z",
                "impact": "high",
                "actual": None,
                "forecast": "180K",
                "previous": "227K"
            },
            {
                "id": "ev2",
                "name": "Unemployment Rate",
                "currency": "USD",
                "datetime": f"{date_str}T13:30:00Z",
                "impact": "high",
                "actual": None,
                "forecast": "4.2%",
                "previous": "4.2%"
            }
        ])
    
    if "EUR" in currencies:
        events.extend([
            {
                "id": "ev3",
                "name": "ECB Interest Rate Decision",
                "currency": "EUR",
                "datetime": f"{date_str}T12:45:00Z",
                "impact": "high",
                "actual": None,
                "forecast": "4.50%",
                "previous": "4.50%"
            }
        ])
    
    return events

# Endpoints
@router.get("/full/{symbol}")
async def get_full_analysis(symbol: str):
    """Get complete market analysis for a symbol"""
    return get_sample_analysis(symbol)

@router.get("/sentiment/{symbol}")
async def get_sentiment(symbol: str):
    """Get market sentiment for a symbol"""
    analysis = get_sample_analysis(symbol)
    return analysis["sentiment"]

@router.get("/prediction/{symbol}")
async def get_prediction(symbol: str):
    """Get price prediction for a symbol"""
    analysis = get_sample_analysis(symbol)
    return analysis["prediction"]

@router.get("/technical-levels/{symbol}")
async def get_technical_levels(symbol: str):
    """Get technical support/resistance levels"""
    analysis = get_sample_analysis(symbol)
    return analysis["technical_levels"]

@router.get("/previous-day/{symbol}")
async def get_previous_day(symbol: str):
    """Get previous day trading data"""
    analysis = get_sample_analysis(symbol)
    return analysis["previous_day"]

@router.get("/recommendations/{symbol}")
async def get_recommendations(symbol: str):
    """Get strategic trading recommendations"""
    analysis = get_sample_analysis(symbol)
    return analysis["recommendations"]

@router.get("/conclusions/{symbol}")
async def get_conclusions(symbol: str):
    """Get market conclusions and outlook"""
    analysis = get_sample_analysis(symbol)
    return analysis["conclusions"]

@router.get("/monetary-policies/{symbol}")
async def get_monetary_policies_endpoint(symbol: str):
    """Get monetary policies for currencies in the symbol"""
    return get_monetary_policies(symbol)

@router.get("/major-news/{symbol}")
async def get_major_news(symbol: str):
    """Get major news affecting the symbol"""
    analysis = get_sample_analysis(symbol)
    return analysis["major_news"]

@router.get("/relevant-news/{symbol}")
async def get_relevant_news(symbol: str):
    """Get relevant news for the symbol"""
    analysis = get_sample_analysis(symbol)
    return analysis["relevant_news"]

@router.get("/economic-events/{symbol}/{date_str}")
async def get_economic_events_endpoint(symbol: str, date_str: str):
    """Get economic events for a symbol on a specific date"""
    return get_economic_events(symbol, date_str)
