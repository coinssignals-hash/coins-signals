"""
MetaAPI Proxy Router
Proxies requests to MetaAPI client API from edge functions
that can't reach MetaAPI directly due to TLS certificate issues.
"""

import os
import httpx
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

METAAPI_TOKEN = os.getenv("METAAPI_TOKEN", "")


class MetaApiProxyRequest(BaseModel):
    """Request body for MetaAPI proxy."""
    account_id: str
    region: str = "vint-hill"
    endpoint: str  # e.g. "account-information", "positions", "history-deals/time/..."
    method: str = "GET"
    body: Optional[dict] = None
    meta_token: Optional[str] = None  # Override token if provided


@router.post("/proxy")
async def metaapi_proxy(req: MetaApiProxyRequest):
    """
    Proxies a request to the MetaAPI client API.
    Used by edge functions that can't reach MetaAPI due to TLS issues.
    """
    token = req.meta_token or METAAPI_TOKEN
    if not token:
        raise HTTPException(status_code=503, detail="MetaAPI token not configured")

    # Whitelist allowed endpoints to prevent abuse
    allowed_prefixes = [
        "account-information",
        "positions",
        "history-deals",
        "orders",
        "symbols",
    ]
    if not any(req.endpoint.startswith(prefix) for prefix in allowed_prefixes):
        raise HTTPException(status_code=400, detail=f"Endpoint not allowed: {req.endpoint}")

    base_url = f"https://mt-client-api-v1.{req.region}.agiliumtrade.agiliumtrade.ai"
    url = f"{base_url}/users/current/accounts/{req.account_id}/{req.endpoint}"

    headers = {
        "auth-token": token,
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            if req.method.upper() == "GET":
                response = await client.get(url, headers=headers)
            elif req.method.upper() == "POST":
                response = await client.post(url, headers=headers, json=req.body or {})
            else:
                raise HTTPException(status_code=400, detail=f"Method not supported: {req.method}")

            if response.status_code >= 400:
                return {
                    "error": True,
                    "status": response.status_code,
                    "body": response.text,
                }

            return {
                "error": False,
                "status": response.status_code,
                "data": response.json(),
            }

    except httpx.ConnectError as e:
        return {"error": True, "status": 502, "body": f"Connection error: {str(e)}"}
    except httpx.TimeoutException:
        return {"error": True, "status": 504, "body": "Request timeout"}
    except Exception as e:
        return {"error": True, "status": 500, "body": str(e)}
