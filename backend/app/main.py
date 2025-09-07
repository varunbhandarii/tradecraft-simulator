import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.trading_service import check_pending_orders_job
from app.services.daily_snapshot_service import daily_snapshot_job
from app.api.endpoints import auth, users, market, trading, portfolio, watchlist

scheduler = AsyncIOScheduler(timezone="UTC")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Code to run on startup ---
    print("INFO:     Starting application and scheduler...")
    # Add the job to check pending orders every minute
    # 'interval' trigger runs the job at fixed intervals
    scheduler.add_job(
        check_pending_orders_job,
        trigger='interval',
        minutes=5,
        id='pending_order_check_job',
        name='Check and Execute Pending Limit Orders',
        replace_existing=True
    )

    
    scheduler.start()
    print("INFO:     Scheduler started with pending order check job.")

    yield # Application runs here

    # --- Code to run on shutdown ---
    print("INFO:     Shutting down scheduler...")
    scheduler.shutdown()
    print("INFO:     Scheduler shut down.")

# Pass the lifespan manager to the FastAPI app
app = FastAPI(
    title="TradeCraft Simulator API",
    lifespan=lifespan # Register the lifespan handler
)

# --- CORS Middleware Configuration ---
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN")
origins = []
if FRONTEND_ORIGIN:
    print(f"INFO: Allowing CORS origin: {FRONTEND_ORIGIN}")
    origins.append(FRONTEND_ORIGIN)
else:
    print("WARNING: FRONTEND_ORIGIN environment variable not set. CORS might block frontend requests.")
    # origins.append("http://localhost:3000") # Uncomment for local testing

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- End CORS Configuration ---


api_prefix = "/api/v1"
app.include_router(auth.router, prefix=f"{api_prefix}/auth", tags=["Authentication"])
app.include_router(users.router, prefix=f"{api_prefix}/users", tags=["Users"])
app.include_router(market.router, prefix=f"{api_prefix}/market", tags=["Market Data"])
app.include_router(trading.router, prefix=f"{api_prefix}/trading", tags=["Trading"])
app.include_router(portfolio.router, prefix=f"{api_prefix}/portfolio", tags=["Portfolio"])
app.include_router(watchlist.router, prefix=f"{api_prefix}/watchlist", tags=["Watchlist"])


# --- Root endpoint ---
@app.get("/")
async def root():
    return {"message": "Welcome to the TradeCraft Simulator API - Go to /docs for API documentation"}