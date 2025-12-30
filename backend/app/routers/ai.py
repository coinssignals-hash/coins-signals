"""
AI Analysis API Router
Endpoints for AI-powered market analysis
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from app.services.ai_analysis import ai_service

router = APIRouter()

class MarketData(BaseModel):
    current_price: float
    previous_close: float
    high: float
    low: float
    volume: Optional[float] = None

class TechnicalIndicators(BaseModel):
    rsi: Optional[float] = None
    macd: Optional[dict] = None
    sma20: Optional[float] = None
    sma50: Optional[float] = None

class AnalysisRequest(BaseModel):
    symbol: str
    market_data: Optional[MarketData] = None
    technical_indicators: Optional[TechnicalIndicators] = None
    news_context: Optional[List[str]] = None

@router.post("/sentiment/{symbol}")
async def generate_sentiment_analysis(
    symbol: str,
    request: Optional[AnalysisRequest] = None
):
    """Generate AI-powered sentiment analysis for a symbol"""
    kwargs = {}
    if request:
        if request.market_data:
            kwargs["market_data"] = request.market_data.model_dump()
        if request.technical_indicators:
            kwargs["technical_indicators"] = request.technical_indicators.model_dump()
        if request.news_context:
            kwargs["news_context"] = request.news_context
    
    result = await ai_service.get_sentiment(symbol, **kwargs)
    
    if "error" in result and not result.get("fallback"):
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result

@router.post("/prediction/{symbol}")
async def generate_prediction(
    symbol: str,
    request: Optional[AnalysisRequest] = None
):
    """Generate AI-powered price prediction for a symbol"""
    kwargs = {}
    if request:
        if request.market_data:
            kwargs["market_data"] = request.market_data.model_dump()
        if request.technical_indicators:
            kwargs["technical_indicators"] = request.technical_indicators.model_dump()
        if request.news_context:
            kwargs["news_context"] = request.news_context
    
    result = await ai_service.get_prediction(symbol, **kwargs)
    
    if "error" in result and not result.get("fallback"):
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result

@router.post("/conclusions/{symbol}")
async def generate_conclusions(
    symbol: str,
    request: Optional[AnalysisRequest] = None
):
    """Generate AI-powered market conclusions for a symbol"""
    kwargs = {}
    if request:
        if request.market_data:
            kwargs["market_data"] = request.market_data.model_dump()
        if request.technical_indicators:
            kwargs["technical_indicators"] = request.technical_indicators.model_dump()
        if request.news_context:
            kwargs["news_context"] = request.news_context
    
    result = await ai_service.get_conclusions(symbol, **kwargs)
    
    if "error" in result and not result.get("fallback"):
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result

@router.post("/recommendations/{symbol}")
async def generate_recommendations(
    symbol: str,
    request: Optional[AnalysisRequest] = None
):
    """Generate AI-powered trading recommendations for a symbol"""
    kwargs = {}
    if request:
        if request.market_data:
            kwargs["market_data"] = request.market_data.model_dump()
        if request.technical_indicators:
            kwargs["technical_indicators"] = request.technical_indicators.model_dump()
        if request.news_context:
            kwargs["news_context"] = request.news_context
    
    result = await ai_service.get_recommendations(symbol, **kwargs)
    
    if "error" in result and not result.get("fallback"):
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result

@router.post("/full/{symbol}")
async def generate_full_analysis(
    symbol: str,
    request: Optional[AnalysisRequest] = None
):
    """Generate complete AI-powered analysis for a symbol (all types)"""
    kwargs = {}
    if request:
        if request.market_data:
            kwargs["market_data"] = request.market_data.model_dump()
        if request.technical_indicators:
            kwargs["technical_indicators"] = request.technical_indicators.model_dump()
        if request.news_context:
            kwargs["news_context"] = request.news_context
    
    # Generate all analysis types
    sentiment = await ai_service.get_sentiment(symbol, **kwargs)
    prediction = await ai_service.get_prediction(symbol, **kwargs)
    conclusions = await ai_service.get_conclusions(symbol, **kwargs)
    recommendations = await ai_service.get_recommendations(symbol, **kwargs)
    
    return {
        "symbol": symbol,
        "sentiment": sentiment.get("analysis", sentiment),
        "prediction": prediction.get("analysis", prediction),
        "conclusions": conclusions.get("analysis", conclusions),
        "recommendations": recommendations.get("analysis", recommendations),
        "generated_at": sentiment.get("generated_at"),
        "model": sentiment.get("model", "unknown")
    }
