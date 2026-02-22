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

@router.get("/trends/{year}/{month}")
async def get_news_trends(year: int, month: int):
    """Get historical news trends aggregated by month/year for charts"""
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
    if year < 2020 or year > 2030:
        raise HTTPException(status_code=400, detail="Year must be between 2020 and 2030")
    
    # Aggregate trends data for the given month
    target_month = f"{year}-{month:02d}"
    
    return {
        "period": target_month,
        "year": year,
        "month": month,
        "total_articles": len(SAMPLE_NEWS),
        "by_impact": {
            "high": len([n for n in SAMPLE_NEWS if n["impact"] == "high"]),
            "medium": len([n for n in SAMPLE_NEWS if n["impact"] == "medium"]),
            "low": len([n for n in SAMPLE_NEWS if n["impact"] == "low"]),
        },
        "by_bias": {
            "bullish": len([n for n in SAMPLE_NEWS if n["bias"] == "bullish"]),
            "bearish": len([n for n in SAMPLE_NEWS if n["bias"] == "bearish"]),
            "neutral": len([n for n in SAMPLE_NEWS if n["bias"] == "neutral"]),
        },
        "by_currency": _aggregate_currency_counts(SAMPLE_NEWS),
        "sentiment_score": _calculate_sentiment_score(SAMPLE_NEWS),
    }


@router.get("/trends/range")
async def get_news_trends_range(
    start_year: int = Query(..., ge=2020, le=2030),
    start_month: int = Query(..., ge=1, le=12),
    end_year: int = Query(..., ge=2020, le=2030),
    end_month: int = Query(..., ge=1, le=12),
):
    """Get historical news trends for a date range (for multi-month charts)"""
    results = []
    current_year, current_month = start_year, start_month
    
    while (current_year, current_month) <= (end_year, end_month):
        period = f"{current_year}-{current_month:02d}"
        results.append({
            "period": period,
            "year": current_year,
            "month": current_month,
            "total_articles": len(SAMPLE_NEWS),
            "by_impact": {
                "high": len([n for n in SAMPLE_NEWS if n["impact"] == "high"]),
                "medium": len([n for n in SAMPLE_NEWS if n["impact"] == "medium"]),
                "low": len([n for n in SAMPLE_NEWS if n["impact"] == "low"]),
            },
            "by_bias": {
                "bullish": len([n for n in SAMPLE_NEWS if n["bias"] == "bullish"]),
                "bearish": len([n for n in SAMPLE_NEWS if n["bias"] == "bearish"]),
                "neutral": len([n for n in SAMPLE_NEWS if n["bias"] == "neutral"]),
            },
            "by_currency": _aggregate_currency_counts(SAMPLE_NEWS),
            "sentiment_score": _calculate_sentiment_score(SAMPLE_NEWS),
        })
        
        current_month += 1
        if current_month > 12:
            current_month = 1
            current_year += 1
    
    return {"trends": results, "total_periods": len(results)}


@router.get("/top-by-impact")
async def get_top_news_by_impact(
    currency: Optional[str] = Query(None, description="Filter by currency (e.g. USD, EUR)"),
    min_score: float = Query(0.0, ge=-1.0, le=1.0, description="Minimum absolute impact score"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """Get top news ranked by currency impact score, with optional currency filter and pagination"""
    scored_news = []
    for n in SAMPLE_NEWS:
        impacts = n.get("currency_impacts", [])
        if currency:
            impacts = [ci for ci in impacts if ci["currency"].upper() == currency.upper()]
        if not impacts:
            continue
        max_impact = max(impacts, key=lambda ci: abs(ci["score"]))
        if abs(max_impact["score"]) < abs(min_score):
            continue
        scored_news.append({**n, "_max_impact_score": abs(max_impact["score"])})

    scored_news.sort(key=lambda x: x["_max_impact_score"], reverse=True)

    total = len(scored_news)
    start = (page - 1) * limit
    end = start + limit
    page_items = [{k: v for k, v in item.items() if k != "_max_impact_score"} for item in scored_news[start:end]]

    return {
        "items": page_items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if total > 0 else 0,
    }


@router.post("/refresh")
async def refresh_news():
    """Trigger news refresh/scraping"""
    return {"status": "success", "message": "News refresh initiated"}


def _aggregate_currency_counts(news_list: list) -> dict:
    counts: dict[str, int] = {}
    for n in news_list:
        for c in n["currencies"]:
            counts[c] = counts.get(c, 0) + 1
    return counts


def _calculate_sentiment_score(news_list: list) -> float:
    if not news_list:
        return 0.0
    total = 0.0
    for n in news_list:
        for ci in n["currency_impacts"]:
            total += ci["score"]
    return round(total / max(len(news_list), 1), 2)
