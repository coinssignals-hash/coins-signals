"""
News API Router
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel

router = APIRouter()

# Models
class NewsImpact(BaseModel):
    currency: str
    impact: str  # positive, negative, neutral
    score: float

class NewsItem(BaseModel):
    id: str
    title: str
    summary: str
    content: str
    source: str
    source_url: str
    published_at: str
    currencies: List[str]
    impact: str  # high, medium, low
    bias: str  # bullish, bearish, neutral
    key_points: List[str]
    currency_impacts: List[NewsImpact]
    image_url: Optional[str] = None

# Sample data for development
SAMPLE_NEWS = [
    {
        "id": "1",
        "title": "Federal Reserve Signals Potential Rate Cut in 2025",
        "summary": "The Federal Reserve indicated it may consider rate cuts in 2025 if inflation continues to moderate.",
        "content": "Federal Reserve officials signaled a potential shift in monetary policy...",
        "source": "Reuters",
        "source_url": "https://reuters.com",
        "published_at": datetime.now().isoformat(),
        "currencies": ["USD", "EUR"],
        "impact": "high",
        "bias": "bearish",
        "key_points": [
            "Fed signals potential rate cuts",
            "Inflation showing signs of moderation",
            "USD may weaken against major pairs"
        ],
        "currency_impacts": [
            {"currency": "USD", "impact": "negative", "score": -0.7},
            {"currency": "EUR", "impact": "positive", "score": 0.5}
        ],
        "image_url": None
    },
    {
        "id": "2",
        "title": "ECB Maintains Hawkish Stance on Inflation",
        "summary": "European Central Bank reaffirms commitment to fighting inflation despite growth concerns.",
        "content": "The ECB maintained its hawkish tone during the latest policy meeting...",
        "source": "Bloomberg",
        "source_url": "https://bloomberg.com",
        "published_at": datetime.now().isoformat(),
        "currencies": ["EUR", "GBP"],
        "impact": "high",
        "bias": "bullish",
        "key_points": [
            "ECB maintains hawkish stance",
            "Inflation remains above target",
            "EUR strength expected to continue"
        ],
        "currency_impacts": [
            {"currency": "EUR", "impact": "positive", "score": 0.6},
            {"currency": "GBP", "impact": "neutral", "score": 0.1}
        ],
        "image_url": None
    }
]

@router.get("", response_model=List[NewsItem])
async def get_all_news(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get all economic news"""
    return SAMPLE_NEWS[offset:offset + limit]

@router.get("/{news_id}", response_model=NewsItem)
async def get_news_by_id(news_id: str):
    """Get specific news by ID"""
    for news in SAMPLE_NEWS:
        if news["id"] == news_id:
            return news
    raise HTTPException(status_code=404, detail="News not found")

@router.get("/by-date/{date_str}")
async def get_news_by_date(date_str: str):
    """Get news by date (format: YYYY-MM-DD)"""
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Filter news by date (for demo, return all)
    return SAMPLE_NEWS

@router.get("/currency/{currency}")
async def get_news_by_currency(currency: str):
    """Get news by currency"""
    currency = currency.upper()
    filtered = [n for n in SAMPLE_NEWS if currency in n["currencies"]]
    return filtered

@router.post("/refresh")
async def refresh_news():
    """Trigger news refresh/scraping"""
    return {"status": "success", "message": "News refresh initiated"}
