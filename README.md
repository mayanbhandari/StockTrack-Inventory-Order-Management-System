# StockTrack - Inventory & Order Management System

A Production-Ready Containerized Inventory and Order Management application built with **FastAPI**, **React**, **PostgreSQL**, and **Docker**. Manage products, customers, and orders with automatic stock tracking and validation.

## Features

- **Product management** - CRUD with unique SKU validation and stock tracking
- **Customer management** - Create, list, view, and delete with unique email enforcement
- **Order management** - Multi-item orders with automatic total calculation and stock reduction
- **Dashboard** - Summary stats and low-stock alerts
- **Business rules** - Insufficient stock blocks orders; cancelling an order restores inventory

## Tech Stack

| Layer        | Technology              |
|-------------|-------------------------|
| Backend     | Python, FastAPI         |
| Frontend    | React, Vite             |
| Database    | PostgreSQL 16           |
| Containers  | Docker, Docker Compose  |

## Project Structure

```
.
├── backend/           # FastAPI API
│   ├── app/
│   │   ├── routers/   # products, customers, orders, dashboard
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── main.py
│   └── Dockerfile
├── frontend/          # React SPA
│   ├── src/
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Quick Start (Docker)

### Prerequisites

- Docker & Docker Compose installed

### Run locally

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Start all services:

```bash
docker compose up --build
```

3. Open the app:

| Service   | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:3000        |
| Backend   | http://localhost:8000        |
| API Docs  | http://localhost:8000/docs   |

4. Stop services:

```bash
docker compose down
```

## API Endpoints

### Products
| Method | Endpoint           | Description        |
|--------|--------------------|--------------------|
| POST   | `/products`        | Create product     |
| GET    | `/products`        | List all products  |
| GET    | `/products/{id}`   | Get product by ID  |
| PUT    | `/products/{id}`   | Update product     |
| DELETE | `/products/{id}`   | Delete product     |

### Customers
| Method | Endpoint            | Description         |
|--------|---------------------|---------------------|
| POST   | `/customers`        | Create customer     |
| GET    | `/customers`        | List all customers  |
| GET    | `/customers/{id}`   | Get customer by ID  |
| DELETE | `/customers/{id}`   | Delete customer     |

### Orders
| Method | Endpoint         | Description                    |
|--------|------------------|--------------------------------|
| POST   | `/orders`        | Create order (reduces stock)   |
| GET    | `/orders`        | List all orders                |
| GET    | `/orders/{id}`   | Get order details              |
| DELETE | `/orders/{id}`   | Cancel order (restores stock)  |

### Dashboard
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | `/dashboard/summary`  | Stats & low-stock items  |

## Environment Variables

| Variable              | Description                              | Example                          |
|-----------------------|------------------------------------------|----------------------------------|
| `POSTGRES_USER`       | Database username                        | `inventory_user`                 |
| `POSTGRES_PASSWORD`   | Database password                        | *(set a strong value)*           |
| `POSTGRES_DB`         | Database name                            | `inventory_db`                   |
| `DATABASE_URL`        | Full PostgreSQL connection string        | `postgresql://user:pass@db:5432/inventory_db` |
| `CORS_ORIGINS`        | Allowed frontend origins (comma-separated) | `https://your-app.vercel.app`    |
| `VITE_API_URL`        | Backend URL for frontend build           | `https://your-api.onrender.com`  |
| `LOW_STOCK_THRESHOLD` | Stock level flagged as low               | `10`                             |

## Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: StockTrack inventory system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/stocktrack.git
git push -u origin main
```

### 2. Backend — Render (recommended)

1. Create a [Render](https://render.com) account
2. **New → Blueprint** and connect your GitHub repo (uses `render.yaml`), **or** create manually:
   - **Web Service** → Docker → set root to `backend/`
   - **PostgreSQL** database (free tier)
3. Set environment variables:
   - `DATABASE_URL` - from Render PostgreSQL dashboard (Internal URL)
   - `CORS_ORIGINS` - your frontend URL (e.g. `https://stocktrack.vercel.app`)
4. Deploy and note your API URL: `https://stocktrack-api.onrender.com`

**Alternative:** Railway or Fly.io with the same `backend/Dockerfile`.

### 3. Backend - Docker Hub

Build and push the backend image:

```bash
docker build -t YOUR_DOCKERHUB_USERNAME/stocktrack-api:latest ./backend
docker login
docker push YOUR_DOCKERHUB_USERNAME/stocktrack-api:latest
```

Docker Hub image link format:
`https://hub.docker.com/r/YOUR_DOCKERHUB_USERNAME/stocktrack-api`

### 4. Frontend - Vercel

1. Import the GitHub repo on [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   - `VITE_API_URL` = your deployed backend URL (e.g. `https://stocktrack-api.onrender.com`)
4. Deploy

**Alternative:** Netlify - set base directory to `frontend`, build command `npm run build`, publish `dist`, and add the same `VITE_API_URL`.

### 5. Verify deployment

- Backend health: `GET https://YOUR-API-URL/health`
- Frontend loads and can create products, customers, and orders
- CORS is configured so the frontend can reach the backend

## Local Development (without Docker)

### Prerequisites

1. Start only the database container from the project root:

```bash
docker compose up db -d
```

2. Use a virtual environment with an **upgraded pip** (required on macOS with Python 3.9):

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
export DATABASE_URL=postgresql://inventory_user:inventory_pass@localhost:5432/inventory_db
uvicorn app.main:app --reload --port 8000
```

**If `psycopg2-binary` fails with `pg_config executable not found`:** upgrade pip first (`python -m pip install --upgrade pip`) and retry. The project pins `psycopg2-binary==2.9.12`, which includes pre-built wheels for Apple Silicon.

### Frontend

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev
```

Open http://localhost:5173

## Business Rules Implemented

- Product SKU must be unique
- Customer email must be unique
- Product quantity cannot be negative
- Orders rejected when stock is insufficient
- Stock automatically reduced on order creation
- Order total calculated server-side
- Proper HTTP status codes (201, 404, 409, 422, 400)
- Request validation on all inputs

## Submission Checklist

- [ ] GitHub repository link (frontend + backend)
- [ ] Docker Hub backend image link
- [ ] Live frontend URL (Vercel / Netlify)
- [ ] Live backend API URL (Render / Railway / Fly.io)



| Deliverable | URL |
|-------------|-----|
| GitHub repository | `https://github.com/YOUR_USERNAME/stocktrack` |
| Backend Docker Hub image | `https://hub.docker.com/r/YOUR_DOCKERHUB_USERNAME/stocktrack-api` |
| Frontend hosted app | `https://YOUR_FRONTEND_URL` |
| Backend API | `https://YOUR_BACKEND_URL` |


