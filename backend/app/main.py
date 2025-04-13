from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import auth, users, market, trading, portfolio

app = FastAPI(title="Simulated Trading Platform API")

# --- CORS Middleware Configuration ---
# List of origins that are allowed to make requests
origins = [
    "http://localhost:3000", # Allow Next.js frontend
    # You might add other origins if needed, e.g., a deployed frontend URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Allows specified origins
    allow_credentials=True, # Allows cookies/authorization headers
    allow_methods=["*"],    # Allows all methods (GET, POST, PUT, DELETE, OPTIONS, etc.)
    allow_headers=["*"],    # Allows all headers
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
    return {"message": "Welcome to the Trading Platform API - Go to /docs for API documentation"}