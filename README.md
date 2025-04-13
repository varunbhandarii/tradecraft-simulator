# Simulated Trading Platform

A full-stack web application simulating a stock trading environment, developed as an MS CS project. Users can register, manage a virtual portfolio with simulated cash, place buy/sell orders based on near-real-time data (via yfinance), track performance, and view basic risk analysis (Value at Risk).

## Features

* **User Authentication:** Secure registration and login using JWT tokens.
* **Market Data:** Integration with `yfinance` library to fetch data derived from Yahoo Finance (current prices, daily historical data).
* **Simulated Trading:** Place Market Buy/Sell orders for stock symbols.
* **Portfolio Management:** Track virtual cash balance and stock holdings (quantity, average cost basis).
* **Portfolio Valuation:** Calculates current market value of holdings and overall portfolio value based on fetched prices.
* **Performance Tracking:** Displays unrealized Profit/Loss per holding and for the total portfolio.
* **Trade History:** Logs and displays all user transactions.
* **Risk Analysis:** Calculates Value at Risk (VaR) using the Historical Simulation method based on selected lookback period and confidence level.
* **Responsive Frontend:** User interface built with Next.js, React, and Tailwind CSS.
* **Containerized:** Fully containerized using Docker and Docker Compose for easy setup and deployment.

## Technologies Used

* **Backend:**
    * Python 3.11+
    * FastAPI
    * SQLAlchemy (ORM)
    * Alembic (Database Migrations)
    * Pydantic (Data Validation)
    * `yfinance` (Market Data Source)
    * `passlib[bcrypt]` (Password Hashing)
    * `python-jose[cryptography]` (JWT Handling)
    * Uvicorn (ASGI Server)
* **Frontend:**
    * React 18+
    * Next.js 14+ (App Router)
    * TypeScript
    * Tailwind CSS
    * Axios (HTTP Client)
    * `date-fns` (Date Formatting)
    * `lucide-react` (Icons - Optional)
* **Database:**
    * PostgreSQL (v14 or v15 recommended)
* **Containerization:**
    * Docker
    * Docker Compose

## Project Structure
trading-platform/
├── backend/
│   ├── alembic/         # Database migration scripts
│   ├── app/             # FastAPI application code (main, api, services, crud, models, schemas)
│   ├── venv/            # Virtual environment (ignored)
│   ├── .env             # Backend environment variables (DB URL, JWT Secret) - REQUIRED, see below
│   ├── Dockerfile       # Backend Docker build instructions
│   └── requirements.txt # Python dependencies
├── frontend/
│   ├── public/          # Static assets
│   ├── src/             # Next.js application code (app router, components, context, services, utils)
│   ├── node_modules/    # Node dependencies (ignored)
│   ├── .env.local       # Frontend environment variables (API URL) - REQUIRED, see below
│   ├── Dockerfile       # Frontend Docker build instructions (multi-stage)
│   └── ...              # Next.js config, package.json, etc.
├── docker-compose.yml   # Docker Compose orchestration file
└── README.md            # This file

## Setup and Running (Docker Compose - Recommended)

This is the easiest way to get the entire application (Database, Backend, Frontend) running.

### Prerequisites

* [Docker](https://docs.docker.com/get-docker/) installed and running.
* [Docker Compose](https://docs.docker.com/compose/install/) installed (usually included with Docker Desktop).
* [Git](https://git-scm.com/downloads) installed.

### Steps

1.  **Clone the Repository:**
    ```bash
    git clone <repo-url>
    cd trading-platform
    ```
    *(Replace `<repo-url>` with the actual URL of your repository)*

2.  **Configure Environment Variables:**

    * **Backend:** Create a file named `.env` inside the `backend/` directory (`backend/.env`). Add the following variables, replacing placeholder values:

        ```dotenv
        # backend/.env

        # Database connection string - Uses Docker Compose service name 'db' and internal port 5432
        # Replace YOUR_CHOSEN_SECURE_PASSWORD with the SAME password set in docker-compose.yml for POSTGRES_PASSWORD
        DATABASE_URL=postgresql://trading_user:YOUR_CHOSEN_SECURE_PASSWORD@db:5432/trading_platform_db

        # Generate a strong secret key for JWT (e.g., using: openssl rand -hex 32)
        SECRET_KEY=YOUR_GENERATED_STRONG_RANDOM_SECRET_KEY_HERE
        ```

    * **Frontend:** Create a file named `.env.local` inside the `frontend/` directory (`frontend/.env.local`). Add the following variable:

        ```dotenv
        # frontend/.env.local

        # URL the frontend (running in the browser) uses to reach the backend API
        # Uses localhost and the host port mapped in docker-compose.yml
        NEXT_PUBLIC_API_BASE_URL=[http://127.0.0.1:8000/api/v1](http://127.0.0.1:8000/api/v1)
        ```

    * **Database Password Consistency:** Ensure the password (`YOUR_CHOSEN_SECURE_PASSWORD`) you put in `backend/.env` **exactly matches** the `POSTGRES_PASSWORD` variable set under the `db` service's `environment` section in the main `docker-compose.yml` file.

    * **Security Note:** These `.env` files contain sensitive information and should **NOT** be committed to public Git repositories. Ensure they are listed in your root `.gitignore` file.

3.  **Build Docker Images:**
    * Open a terminal in the project root directory (`trading-platform`).
    * Run:
        ```bash
        docker compose build
        ```
    * This will build the custom images for your backend and frontend based on their respective `Dockerfile`s. It might take some time on the first run.

4.  **Run the Application:**
    * Run:
        ```bash
        docker compose up -d
        ```
    * This starts the PostgreSQL database, backend API, and frontend server in detached mode.

5.  **Access the Application:**
    * **Frontend UI:** Open your browser and go to `http://localhost:3000`
    * **Backend API Docs (Swagger UI):** Open `http://localhost:8000/docs`

6.  **Stopping the Application:**
    * To stop the containers:
        ```bash
        docker compose down
        ```
    * To stop containers AND remove the database volume (deletes all data):
        ```bash
        docker compose down -v
        ```

## (Optional) Local Development Setup

If you prefer to run services locally without Docker containers:

1.  **Prerequisites:** Python 3.11+, Node.js 18+, a locally running PostgreSQL instance.
2.  **Backend:**
    * Navigate to `backend/`.
    * Create and activate a Python virtual environment (`python -m venv venv`, `.\venv\Scripts\activate` or `source venv/bin/activate`).
    * Install dependencies: `pip install -r requirements.txt`.
    * Set environment variables (`DATABASE_URL` pointing to your *local* Postgres, `SECRET_KEY`).
    * Run database migrations: `alembic upgrade head`.
    * Start the server: `uvicorn app.main:app --reload --port 8000`.
3.  **Frontend:**
    * Navigate to `frontend/`.
    * Install dependencies: `npm install`.
    * Set environment variable `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1`.
    * Start the server: `npm run dev`.
4.  **Database:** Ensure your local PostgreSQL server is running, has the correct database created, and the user specified in the backend `DATABASE_URL` exists with the correct password and privileges.

## API Documentation

Live, interactive API documentation (Swagger UI) is automatically generated by FastAPI and available at the `/docs` endpoint of the running backend server (e.g., `http://localhost:8000/docs`).

## Future Enhancements

* Implement Limit Orders in addition to Market Orders.
* Add more sophisticated Risk Metrics (e.g., Sharpe Ratio, Beta).
* Integrate charting libraries (e.g., Chart.js, Plotly) for portfolio performance visualization.
* Implement real-time price updates (would likely require a paid API or WebSockets).
* More comprehensive automated testing (unit, integration, end-to-end).
* User profile management (e.g., password change).
* Pagination for Trade History.
* Deployment configuration (e.g., using platforms like AWS, Google Cloud, Heroku, Vercel).

---
