# TradeCraft Simulator

TradeCraft Simulator is a full-stack web application designed for simulating stock trading, managing virtual portfolios, performing risk analysis (Value at Risk), and tracking portfolio performance over time.

Users can register, receive virtual cash, place market and limit orders using data from Alpaca Markets, monitor their holdings, view trade history, and analyze portfolio value trends and asset allocation with basic charts.

## Features

* **User Authentication:** Secure user registration and login using JWT (JSON Web Token) authentication.
* **Market Data Integration:** Fetches stock market data (current prices, daily historical data) using the Alpaca Markets API. Includes caching and throttling for API calls.
* **Simulated Trading:**
    * **Market Orders:** Place buy and sell orders that execute at the current available market price.
    * **Limit Orders:** Place buy and sell orders that execute only if the market price reaches a specified limit price or better.
* **Pending Order Management:** View and cancel pending limit orders.
* **Automated Order Execution Engine:** Backend scheduler (APScheduler) periodically checks and executes eligible pending limit orders.
* **Portfolio Management:**
    * Track virtual cash balance.
    * Manage stock holdings (quantity, average cost basis).
    * Real-time (or last close) portfolio and individual holding valuation.
    * Calculation and display of unrealized Profit/Loss.
* **Trade History:** Detailed log of all executed buy and sell transactions.
* **Risk Analysis:**
    * Value at Risk (VaR) calculation for the current portfolio using the Historical Simulation method.
* **Portfolio Analytics & Charting:**
    * Database storage of daily end-of-day portfolio value snapshots.
    * API endpoint to serve historical portfolio value data.
    * Frontend "Portfolio Value Over Time" line chart.
    * Frontend "Asset Allocation" pie/doughnut chart.
* **Responsive Frontend UI:** User interface built with Next.js, React, TypeScript, and Tailwind CSS.
* **Containerized:** Fully containerized using Docker and Docker Compose for easy local setup and consistent environments.
* **Cloud Deployed:** Designed for deployment on cloud platforms.

## Technologies Used

* **Backend:**
    * Python 3.11+
    * FastAPI (ASGI Framework)
    * SQLAlchemy (ORM)
    * Alembic (Database Migrations)
    * Pydantic (Data Validation & Serialization)
    * `alpaca-py` (Alpaca Markets API SDK for market data)
    * `APScheduler` (For scheduling order execution and daily snapshots)
    * `passlib[bcrypt]` (Password Hashing)
    * `python-jose[cryptography]` (JWT Handling)
    * Uvicorn (ASGI Server)
* **Frontend:**
    * React 18+
    * Next.js 14+ (App Router)
    * TypeScript
    * Tailwind CSS
    * Axios (HTTP Client)
    * `chart.js` & `react-chartjs-2` (Charting)
    * `date-fns` (Date Formatting)
    * `lucide-react` (Icons)
* **Database:**
    * PostgreSQL (v14 or v15 recommended)
* **Containerization:**
    * Docker
    * Docker Compose

## Setup and Running (Docker Compose - Recommended for Local Development)

This method starts the database, backend, and frontend in their respective Docker containers locally.

### Prerequisites

* [Docker Desktop](https://docs.docker.com/get-docker/) (includes Docker Compose) installed and running.
* [Git](https://git-scm.com/downloads) installed.

### Steps

1.  **Clone the Repository:**

2.  **Configure Environment Variables:**

3.  **Build Docker Images:**
    * From the project root directory (`TradeCraft-Simulator/`), run:
        ```bash
        docker compose build
        ```
    * This might take a few minutes the first time.

4.  **Run the Application:**
    * From the project root, run:
        ```bash
        docker compose up -d
        ```
    * (Use `docker compose up` without `-d` to see all logs in the current terminal).
    * The backend's `entrypoint.sh` will automatically run database migrations (`alembic upgrade head`) on startup.

5.  **Access the Application:**
    * **Frontend UI:** `http://localhost:3000`
    * **Backend API Docs (Swagger UI):** `http://localhost:8000/docs`

6.  **Stopping the Application:**
    * If running in detached mode (`-d`): `docker compose down`
    * To also remove the database volume (deletes all data): `docker compose down -v`
    * If running in the foreground, press `Ctrl+C` in the terminal.
