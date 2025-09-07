import os
from dotenv import load_dotenv

# Load variables from .env file in the parent directory (backend/.env)
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
load_dotenv(dotenv_path=dotenv_path)

DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256" # Algorithm for JWT
ACCESS_TOKEN_EXPIRE_MINUTES = 30 # JWT token validity period

ALPACA_API_KEY_ID = os.getenv("ALPACA_API_KEY_ID")
ALPACA_API_SECRET_KEY = os.getenv("ALPACA_API_SECRET_KEY")
ALPACA_PAPER_TRADING = os.getenv("ALPACA_PAPER_TRADING", "true").lower() == "true"
SNAPSHOT_TRIGGER_KEY = os.getenv("SNAPSHOT_TRIGGER_KEY")

if not ALPACA_API_KEY_ID:
    print("WARNING: ALPACA_API_KEY_ID environment variable not set.")
if not ALPACA_API_SECRET_KEY:
    print("WARNING: ALPACA_API_SECRET_KEY environment variable not set.")

# Basic input validation
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable not set")