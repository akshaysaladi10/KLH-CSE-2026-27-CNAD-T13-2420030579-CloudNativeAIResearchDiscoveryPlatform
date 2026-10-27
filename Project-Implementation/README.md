# Cloud-Native AI Research Discovery Platform

[![Architecture: Microservices](https://img.shields.io/badge/Architecture-Cloud--Native%20Microservices-blue.svg)](https://github.com/akshaysaladi10/KLH-CSE-2026-27-CNAD-T13-2420030579-CloudNativeAIResearchDiscoveryPlatform)
[![Frontend: React 19 + Vite](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%20%2B%20Tailwind-61dafb.svg)](https://vitejs.dev/)
[![Backend: Node.js + Express](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green.svg)](https://nodejs.org/)
[![AI Services: Python FastAPI](https://img.shields.io/badge/AI%20%26%20PDF-Python%203.10%20FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Storage: MongoDB & MinIO](https://img.shields.io/badge/Storage-MongoDB%20%26%20MinIO%20S3-red.svg)](https://min.io/)

A complete, production-grade cloud-native application engineered to accelerate academic literature discovery, automate research PDF intake, extract structured scientific insights using NLP, and provide contextual research recommendations across containerized microservices.

Developed for **B.Tech Computer Science & Engineering (Cloud-Native Application Development — CNAD)**  
**KL University (KLH Hyderabad Bowrampet Campus)**  
**Guide:** Dr. Patha Srilatha, Associate Professor, Dept. of CSE  
**Team 13:**  
- B. Akhil — `2420030141`  
- P. Ruthvik — `2420030546`  
- S. Akshay — `2420030579`  

---

## 1. System Architecture & Component Decoupling

The platform adheres to cloud-native microservice decoupling principles, containerized via Docker and orchestrated through Docker Compose on an isolated internal network (`backend-network`).

```
                              [ Web Browser / Client ]
                                         │
                         HTTP/REST (Port 5173 - Vite SPA)
                                         │
                                         ▼
                     ┌──────────────────────────────────────┐
                     │          API Gateway (Port 3000)     │
                     │  - Reverse Proxying & Request Routing│
                     │  - CORS & Rate Limiting Enforcement  │
                     │  - Centralized Health Monitoring     │
                     └──────────────────┬───────────────────┘
                                        │
           ┌────────────────┬───────────┼───────────┬────────────────┐
           ▼                ▼           ▼           ▼                ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────┐ ┌───────────┐ ┌──────────────┐
   │ Auth Service │ │Paper Service │ │Search│ │PDF Service│ │  AI Service   │
   │ (Port 3001)  │ │ (Port 3002)  │ │ & Rec│ │(Port 8001)│ │ (Port 8002)  │
   │ - JWT / Auth │ │ - Cataloging │ │(3003)│ │- PyMuPDF  │ │ - Scientific │
   │ - BCrypt PW  │ │ - Collections│ │-Open-│ │- Text     │ │   NLP Engine │
   │ - RBAC Roles │ │ - S3 Storage │ │ Alex │ │  Stream   │ │ - OpenAI /   │
   └──────┬───────┘ └──────┬───────┘ └──┬───┘ └─────┬─────┘ │   Offline    │
          │                │            │           │       └──────┬───────┘
          └────────┬───────┴────────────┴───────────┼──────────────┘
                   ▼                                ▼
       ┌───────────────────────┐        ┌───────────────────────┐
       │     MongoDB (27017)   │        │     MinIO S3 (9000)   │
       │ Users, Papers, Stats, │        │ Binary Research Paper │
       │ Collections, History  │        │   PDF Object Storage  │
       └───────────────────────┘        └───────────────────────┘
```

### Microservices Summary

| Service | Technology | Port | Responsibilities |
|---|---|---|---|
| **API Gateway** | Express / Node.js 20 | `3000` | Single entry point, routing (`/api/*`), CORS header handling, downstream service health checks (`/health`). |
| **Frontend UI** | React 19, Vite, Tailwind | `5173` | Responsive academic portal: Dashboard, Discovery search, Dual-Mode Paper Upload, PDF Viewer, and AI Analysis tabs. |
| **Auth Service** | Node.js 20, BCrypt, JWT | `3001` | User registration, authentication, JWT issuing & verification, role-based access control. |
| **Paper Service** | Node.js 20, Mongoose, AWS SDK | `3002` | Paper metadata CRUD, user personal library/collections, MinIO S3 streaming & presigned URLs, analytics aggregation. |
| **Search & Rec Service** | Node.js 20, Natural NLP | `3003` | OpenAlex open-access scholarly graph querying, local fallback search, Jaccard similarity content recommendation engine. |
| **PDF Processing Service** | Python 3.10, FastAPI, PyMuPDF | `8001` | High-throughput binary PDF text stream extraction, malformed PDF detection, scanned image OCR fallback guidance. |
| **AI Analysis Service** | Python 3.10, FastAPI, NLTK/NLP | `8002` | Scientific NLP pipeline extracting 7 structural pillars: Research Problem, Objectives, Methodology, Findings, Limitations, Gaps, Keywords. Supports OpenAI API or autonomous offline fallback. |
| **MongoDB** | MongoDB 6.0 Image | `27017` | Persistent operational datastore with dedicated volume storage (`mongo-data`). |
| **MinIO** | MinIO Quay.io Image | `9000` / `9001` | High-performance, S3-compatible binary storage with automated bucket provisioning (`research-papers`). |

---

## 2. Key Features

1. **Dual-Mode Document Intake Pipeline:**
   - **Full PDF Upload:** Binary PDF stream sent through Gateway -> MinIO S3 -> PyMuPDF text parser -> Scientific AI Analysis -> MongoDB record update.
   - **Direct Abstract Submission:** Quick input mode for immediate AI decomposition without requiring a pre-compiled PDF document.
2. **Structural Scientific AI Analysis:**
   - Automatic extraction of: *Research Problem, Methodology, Key Findings, Limitations, and Research Gaps*.
   - Offline-capable scientific NLP heuristics ensure zero downtime and zero billing dependencies during demonstrations.
3. **Hybrid Literature Discovery:**
   - Real-time search across OpenAlex's 250M+ scholarly records.
   - Built-in resilience fallback to internal MongoDB index when offline or rate-limited.
4. **Contextual Recommendations:**
   - Jaccard similarity index across author keyword graphs and extracted terminology.
5. **Robust Error Handling:**
   - Corrupted or truncated PDFs are caught safely without container failure.
   - Scanned/image-only PDFs are tagged as `completed_without_ai` with helpful guidance.
   - PDF streaming endpoint streams binary data safely to browser iframe viewers.

---

## 3. Prerequisites for Running on Any Laptop

The project is packaged for cross-platform portability on Windows 10/11, macOS, and Linux.

### Recommended (Docker Setup)
- **Docker Desktop** (version 24.0 or newer) with **Docker Compose v2** enabled.
- RAM: Minimum 4 GB available.
- Disk Space: ~3 GB free for Docker images.

*That's all! Docker will automatically pull MongoDB, MinIO, Node.js, and Python runtimes without requiring local installations.*

### Alternative (Local Development Setup without Docker)
If running directly on the host OS:
- **Node.js**: v18.x or v20.x
- **Python**: 3.10+ with `pip`
- **MongoDB**: Local Community Server running on `localhost:27017`
- **MinIO**: Local MinIO server running on `localhost:9000`

---

## 4. Quick Start: Running with Docker Compose (Recommended)

Follow these exact steps to start the complete platform:

### Step 1: Clone and Enter the Project Implementation Directory
```bash
git clone https://github.com/akshaysaladi10/KLH-CSE-2026-27-CNAD-T13-2420030579-CloudNativeAIResearchDiscoveryPlatform.git
cd KLH-CSE-2026-27-CNAD-T13-2420030579-CloudNativeAIResearchDiscoveryPlatform/Project-Implementation
```

### Step 2: Initialize Environment Configuration
Copy the safe template into `.env`:
```powershell
# On Windows PowerShell:
Copy-Item .env.example .env

# On Linux / macOS / Git Bash:
cp .env.example .env
```
*(The default `.env` is pre-configured with local container hostnames and mock AI fallbacks. No paid API key is needed to run the complete platform!)*

### Step 3: Build and Launch All Services
```bash
docker compose up --build -d
```
Docker Compose will download the base images, build each microservice container, configure the MinIO `research-papers` bucket, and start all 8 containers.

### Step 4: Verify Container Health
Check that all containers are running:
```bash
docker compose ps
```
Or check the API Gateway consolidated health endpoint:
- Open: **`http://localhost:3000/health`**
- It will return JSON showing connectivity status for all downstream services.

### Step 5: Access the Web Application
Open your browser and navigate to:
- **Frontend Academic Portal:** [http://localhost:5173](http://localhost:5173)
- **API Gateway Health Status:** [http://localhost:3000/health](http://localhost:3000/health)
- **MinIO S3 Web Console:** [http://localhost:9001](http://localhost:9001)
  - *Username:* `minioadmin`
  - *Password:* `minioadmin`

### Step 6: Shutdown When Done
```bash
docker compose down
```
To also clear database volumes for a clean state:
```bash
docker compose down -d -v
```

---

## 5. Demonstration Walkthrough (For Reviewers & Evaluators)

Follow these quick steps to experience the complete platform in action:

1. **Register / Login:**
   - Go to [http://localhost:5173](http://localhost:5173).
   - Click **Register** and create a researcher account (e.g. `evaluator@university.edu` / `Password123!`), or login.
2. **Explore Discovery:**
   - Click **Discover** on the top navigation bar.
   - Search for topics such as `"Cloud-Native"`, `"Kubernetes"`, or `"Microservices"`.
   - Results from OpenAlex or internal cache will display instantly with metadata and citation counts.
3. **Upload a Sample Research Paper:**
   - Click **Upload Paper** on the top navigation.
   - Choose **PDF Upload**.
   - Select the included file `sample_cloud_native_research_paper.pdf` located in the project root.
   - Fill in Title (e.g. `"Decentralized Service Mesh Resilience"`), Authors, and Domain.
   - Click **Submit & Analyze**.
4. **Watch Real-Time Processing:**
   - The paper is stored in MinIO S3, parsed by the PDF microservice, and analyzed by the AI microservice.
   - The UI displays an active progress indicator.
5. **Review AI Structural Insights:**
   - Open the uploaded paper details page.
   - Review the extracted **Problem Statement, Objectives, Methodology, Quantitative Findings, Limitations, and Research Gaps**.
   - Preview the actual PDF directly in the browser viewer.
6. **Test Abstract-Only Submission:**
   - Click **Upload Paper** -> select **Abstract Input**.
   - Paste any scientific abstract text and submit. AI analysis is generated instantly.
7. **Personal Library & Collections:**
   - Bookmark papers or create custom research collections (e.g., `"Cloud Resilience 2026"`).

---

## 6. Automated Testing & Verification

All microservices include automated unit, integration, and build tests.

### Running Backend Unit Test Suites
Run all tests across Auth, Paper, and Search services from the root folder:
```bash
npm run test:all
```
Or run individual service test suites:
```bash
npm run test:auth        # Auth Service & JWT security tests (7 tests)
npm run test:paper       # Paper Service & Schema tests (11 tests)
npm run test:search-rec  # Search, Jaccard Similarity & Keyword tests (11 tests)
```
*Expected Result: All 29 unit tests pass with clean test suites.*

### Testing the Frontend Build
Verify that the React 19 + Vite frontend builds cleanly without syntax or bundling errors:
```bash
cd frontend
npm run build
```
*Expected Result: Vite transforms modules and outputs optimized production assets in `dist/`.*

### Running Automated Integration / End-to-End Tests
While the Docker containers are running (`docker compose up -d`):
```bash
# Verify PDF upload flow and MinIO S3 integration:
python verify_upload.py

# Comprehensive end-to-end suite verifying all gateway endpoints:
python test_e2e.py
```

---

## 7. Environment Variables Reference (`.env.example`)

| Variable | Default Value | Description |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment mode |
| `PORT` | `3000` | API Gateway listening port |
| `MONGODB_URI` | `mongodb://mongodb:27017/research-platform` | MongoDB connection URI |
| `JWT_SECRET` | *(configured secret)* | Secret key for signing JSON Web Tokens |
| `JWT_EXPIRES_IN` | `7d` | Token expiry duration |
| `MINIO_ENDPOINT` | `minio` (Docker) / `localhost` (local) | S3 object storage hostname |
| `MINIO_PORT` | `9000` | S3 API port |
| `MINIO_ACCESS_KEY` | `minioadmin` | MinIO root username |
| `MINIO_SECRET_KEY` | `minioadmin` | MinIO root password |
| `MINIO_BUCKET` | `research-papers` | Target S3 bucket for PDFs |
| `AI_PROVIDER` | `openai` | AI backend provider |
| `AI_API_KEY` | *(blank / placeholder)* | Optional OpenAI API Key (falls back to local NLP engine if blank) |
| `AI_MODEL` | `gpt-4o-mini` | Target OpenAI model |
| `AUTH_SERVICE_URL` | `http://auth-service:3001` | Downstream Auth service internal URL |
| `PAPER_SERVICE_URL` | `http://paper-service:3002` | Downstream Paper service internal URL |
| `SEARCH_SERVICE_URL`| `http://search-recommendation-service:3003` | Downstream Search service internal URL |
| `PDF_SERVICE_URL` | `http://pdf-service:8001` | Downstream PDF service internal URL |
| `AI_SERVICE_URL` | `http://ai-service:8002` | Downstream AI service internal URL |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin for frontend |

---

## 8. Troubleshooting & FAQ

#### 1. Port Conflict on Port 3000, 27017, or 9000
If a port is already in use by a background service on your machine:
- Check running ports: `netstat -ano | findstr :3000` (Windows)
- Or modify the host port binding in `docker-compose.yml` (e.g. change `"3000:3000"` to `"3050:3000"`).

#### 2. MinIO S3 Bucket Creation
The `minio-setup` container automatically initializes the `research-papers` bucket upon startup. If needed, you can also log into the web console at [http://localhost:9001](http://localhost:9001) (`minioadmin`/`minioadmin`) to verify or inspect uploaded PDF objects.

#### 3. AI Insights Without OpenAI API Key
The system does **not** require a paid API key to be evaluated. If `AI_API_KEY` is not provided in `.env`, the Python AI Service automatically runs our deterministic scientific NLP parsing pipeline to extract problem statements, methodology, and findings from the text stream.

---

## 9. License & Academic Integrity

This project is submitted as an academic software deliverable for the **Cloud-Native Application Development (CNAD)** curriculum at **KL University**. All code is structured for educational evaluation, reproducibility, and architectural demonstration.
