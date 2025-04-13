# backend/app/main.py
import os # Import the os module to access environment variables
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import auth, users, market, trading, portfolio

# Updated API Title
app = FastAPI(title="TradeCraft Simulator API")

# --- CORS Middleware Configuration ---

# Read the single allowed origin from the environment variable
# This URL should be set to your deployed Cloudflare Pages URL in the Cloud Run environment settings
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN")

origins = []
if FRONTEND_ORIGIN:
    print(f"INFO: Allowing CORS requests from origin: {FRONTEND_ORIGIN}")
    origins.append(FRONTEND_ORIGIN)
else:
    print("WARNING: FRONTEND_ORIGIN environment variable not set.")
    # origins.append("http://localhost:3000") # Uncomment if needed for local dev testing

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # Use the dynamically populated list
    allow_credentials=True,   # Allow cookies/auth headers
    allow_methods=["*"],      # Allow all standard methods
    allow_headers=["*"],      # Allow all standard headers
)
# --- End CORS Configuration ---

# Include routers
api_prefix = "/api/v1"
app.include_router(auth.router, prefix=f"{api_prefix}/auth", tags=["Authentication"])
app.include_router(users.router, prefix=f"{api_prefix}/users", tags=["Users"])
app.include_router(market.router, prefix=f"{api_prefix}/market", tags=["Market Data"])
app.include_router(trading.router, prefix=f"{api_prefix}/trading", tags=["Trading"])
app.include_router(portfolio.router, prefix=f"{api_prefix}/portfolio", tags=["Portfolio"])

@app.get("/")
async def root():
    return {"message": "Welcome to the TradeCraft Simulator API - Go to /docs for API documentation"}