import os
import time
from typing import Optional
from fastapi import FastAPI, HTTPException, Request, Query
from pydantic import BaseModel
from posthog import Posthog

app = FastAPI(title="HogDesk Lite - Ticket Routing API", version="1.0.0")

posthog = Posthog(
    project_api_key=os.getenv("POSTHOG_API_KEY", "phc_demo_key"),
    host="https://us.i.posthog.com",
)

CLIENT_LIMIT_PER_MINUTE = 60
request_tracker = {}

TICKET_ROUTES = {
    "billing": "billing_team@posthog.com",
    "technical": "eng_support@posthog.com",
    "privacy": "gdpr@posthog.com",
    "general": "support@posthog.com",
}


class CheckoutPayload(BaseModel):
    user_id: str
    currency: str = "KES"
    amount: int = 1500
    environment: str = "production"


class TicketPayload(BaseModel):
    user_id: str
    category: str = "general"
    description: str
    priority: Optional[str] = "normal"


@app.post("/api/v1/checkout")
async def process_checkout(payload: CheckoutPayload, request: Request):
    current_time = time.time()
    user_id = payload.user_id

    user_history = request_tracker.get(user_id, [])
    user_history = [t for t in user_history if current_time - t < 60]

    if len(user_history) >= CLIENT_LIMIT_PER_MINUTE:
        posthog.capture(user_id, "capture_call_ignored", {
            "reason": "client_rate_limiting",
            "current_rate_per_minute": len(user_history),
            "endpoint": "/api/v1/checkout",
        })
        raise HTTPException(
            status_code=429,
            detail="Rate limiting active. Request ignored.",
        )

    user_history.append(current_time)
    request_tracker[user_id] = user_history

    posthog.capture(user_id, "payment_submitted", {
        "currency": payload.currency,
        "amount": payload.amount,
        "environment": payload.environment,
    })

    return {
        "status": "success",
        "message": "Transaction verified",
        "user_id": user_id,
    }


@app.post("/api/v1/tickets/route")
async def route_ticket(payload: TicketPayload, request: Request):
    current_time = time.time()
    user_id = payload.user_id

    user_history = request_tracker.get(user_id, [])
    user_history = [t for t in user_history if current_time - t < 60]

    if len(user_history) >= CLIENT_LIMIT_PER_MINUTE:
        posthog.capture(user_id, "capture_call_ignored", {
            "reason": "client_rate_limiting",
            "current_rate_per_minute": len(user_history),
            "endpoint": "/api/v1/tickets/route",
        })
        raise HTTPException(
            status_code=429,
            detail="Rate limiting active. Request ignored.",
        )

    user_history.append(current_time)
    request_tracker[user_id] = user_history

    category = payload.category.lower()
    route_email = TICKET_ROUTES.get(category, TICKET_ROUTES["general"])

    posthog.capture(user_id, "ticket_routed", {
        "category": category,
        "priority": payload.priority,
        "route_email": route_email,
        "description_length": len(payload.description),
    })

    return {
        "status": "routed",
        "ticket_id": f"HD-{int(current_time)}-{user_id[:8]}",
        "category": category,
        "route_email": route_email,
        "priority": payload.priority,
    }


@app.get("/api/v1/health")
async def health():
    return {"status": "healthy", "service": "hogdesk-lite"}


@app.on_event("shutdown")
def shutdown_event():
    posthog.flush()
    posthog.shutdown()
