# CNAD Project Review — Student Defense & Demonstration Notes
**Project Title:** Cloud-Native AI Research Discovery Platform  
**Review Date:** Wednesday, October 28th, 2026  
**Guide:** Dr. Patha Srilatha, Associate Professor, Dept. of CSE, KLH CSE Bowrampet Campus  
**Team Members:**  
- B. Akhil — `2420030141`  
- P. Ruthvik — `2420030546`  
- S. Akshay — `2420030579`  
**Degree / Specialization:** B.Tech Computer Science & Engineering (Cloud-Native Application Development — CNAD)

---

## 1. 5–7 Minute Slide Presentation Script

### Slide 1: Title (0:00 – 0:30)
> *"Respected guide Dr. Patha Srilatha and faculty panel, good morning. We are Team 13, and our project is the **Cloud-Native AI Research Discovery Platform**. In today's review, we are presenting our **actual working implementation**, architectural decoupling, and verified automated testing across our containerized microservices stack."*

### Slide 2: Problem Statement & Overview (0:30 – 1:15)
> *"Academic research today is bottlenecked by four core friction points:
> 1. Literature is scattered across disconnected silos like arXiv, IEEE, and CrossRef.
> 2. Researchers face severe reading fatigue extracting findings from 15+ page PDFs manually.
> 3. Working drafts or abstracts are disconnected from peer literature search.
> 4. Research management is fragmented across personal folders and spreadsheets.
> Our platform unifies academic discovery, dual-mode document intake, automated scientific NLP section extraction, contextual paper recommendations, and persistent library management into one cloud-native interface."*

### Slide 3: Objectives & Research Gap (1:15 – 1:50)
> *"Our literature survey of Kratzke & Quint (2017) on cloud-native patterns and Di Francesco (2019) on microservice decomposition identified that existing tools separate search (Google Scholar), reference management (Zotero), and document analysis. No existing system provides an open, containerized platform that integrates live discovery, structural scientific NLP extraction, S3-compatible document storage, and contextual recommendations in a decoupled microservices architecture. Our objective was to implement and verify this end-to-end."*

### Slide 4 & 5: Architecture & Technology Rationale (1:50 – 2:45)
> *"Our architecture strictly follows cloud-native microservice decoupling:
> - **Client Tier**: React 18 + Vite SPA on port 5173.
> - **Gateway Tier**: Express API Gateway on port 3000 handling reverse proxying, JWT forwarding, cluster health checks, and cross-origin resource policy for PDF streaming.
> - **Core Microservices**: Auth Service (3001) for BCrypt and JWT validation; Paper Service (3002) for document cataloging and S3 operations; Search Service (3003) integrating OpenAlex and Jaccard similarity.
> - **Specialized Python Services**: PDF Processing Service (8001) using C-native PyMuPDF for fast text stream parsing; AI Analysis Service (8002) implementing our scientific NLP extraction pipeline.
> - **Persistence Tier**: MongoDB (27017) with persistent volume disk mapping, and MinIO (9000) providing S3-compatible binary document storage.
> All components communicate over an isolated Docker bridge network using internal DNS resolution."*

### Slide 6: Academic Discovery Workflow (2:45 – 3:20)
> *"For discovery, we query OpenAlex's open-access graph of 250M+ scholarly records. To guarantee system resilience against external API rate-limiting or network downtime, we implemented an automatic fallback to our local MongoDB catalog with multi-field regex search. This ensures researchers always receive search results with zero downtime."*

### Slide 7: Abstract Submission & Scientific AI Pipeline (3:20 – 4:10)
> *"Our primary demonstration feature is the **Dual-Mode Upload Pipeline**. A researcher can paste an abstract directly without uploading a PDF. The backend validates the input, creates a paper record, and triggers the AI Service. 
> To ensure reliability without external cloud billing dependencies, we implemented a **Local Scientific NLP Pipeline** in Python. It parses scientific grammar and frequency distributions to extract seven key structural components: Research Problem, Primary Objectives, Methodology, Major Quantitative Findings, Limitations, Research Gaps/Future Directions, and Technical Keywords. The UI displays an animated 4-stage processing stepper in real-time."*

### Slide 8: PDF Upload & Processing Pipeline (4:10 – 4:50)
> *"When a full research PDF is uploaded, it is streamed to MinIO with a unique S3 key. The PDF Service uses PyMuPDF to extract text streams and forwards them to the AI pipeline. 
> Crucially, we implemented robust error handling:
> - Corrupt or malformed PDFs are caught safely without crashing containers, marking the paper as 'failed'.
> - Scanned or image-only PDFs with insufficient text (<50 characters) are flagged as 'completed_without_ai' with actionable user guidance.
> - The original binary PDF is streamed directly to the browser viewer via the Gateway from MinIO."*

### Slide 9 & 10: Recommendations, Library & Security (4:50 – 5:30)
> *"Recommendations utilize an explainable Jaccard similarity metric over extracted keyword vectors, scoring candidates based on keyword overlap and domain alignment. Researchers can bookmark papers into their personal library with multi-session MongoDB persistence. 
> Security is enforced through BCrypt hashing, stateless JWT tokens, Role-Based Access Control, and strict input boundary limits."*

### Slide 11 & 12: Verification Results & Cloud-Native Status (5:30 – 6:15)
> *"We have subjected the platform to comprehensive automated testing:
> - **Frontend Build**: Vite production build succeeded with zero errors in 925ms.
> - **Backend Unit Tests**: 29 out of 29 passed across Auth, Paper, and Search services.
> - **End-to-End Suite**: 17 out of 17 integration steps passed against the live running API Gateway.
> In our cloud-native status matrix: Containerization, Microservice communication, API Gateway, Object Storage, and Multi-Tier persistence are **100% Implemented and Verified**. Kubernetes manifests and CI/CD test scripts are configured. Managed AWS EKS deployment, Argo CD GitOps, and Prometheus monitoring represent our planned Phase 5 and 6 deliverables."*

### Slide 13 & 14: Demonstration Transition (6:15 – 7:00)
> *"We will now demonstrate the running platform live at `http://localhost:5173` through our documented workflow: logging in as a researcher, querying academic literature, analyzing an abstract in real-time, streaming an uploaded PDF, and verifying library persistence. Thank you, and we welcome your questions."*

---

## 2. Technical Architecture & Request Flow Summary

```
                      [ Client Browser (React 18 + Vite :5173) ]
                                          │
                        HTTP Requests / JWT Authorization
                                          ▼
                      [ API Gateway Reverse Proxy (:3000) ]
                      (Helmet CORP, Rate Limiting, Health)
                     ┌────────────────────┼────────────────────┐
                     ▼                    ▼                    ▼
             [ Auth Service ]     [ Paper Service ]    [ Search & Rec ]
             (Node.js :3001)      (Node.js :3002)      (Node.js :3003)
                     │                    │                    │
                     │          ┌─────────┴─────────┐          │
                     │          ▼                   ▼          ▼
                     │   [ PDF Service ]     [ AI Service ]  [ OpenAlex API ]
                     │   (PyMuPDF :8001)     (FastAPI :8002) (Live REST Graph)
                     │          │                   │          │
                     └──────────┼───────────────────┼──────────┘
                                ▼                   ▼
                        [ MongoDB :27017 ]    [ MinIO Object Store ]
                        (Volumes: data/db)    (Bucket: research-papers)
```

---

## 3. Abstract and PDF Workflow Deep Dive

1. **Abstract Submission**:
   - Client sends `POST /api/papers/analyze-abstract` with `title`, `abstract`, `authors`, `keywords`, `researchDomain`.
   - Input validator rejects empty or whitespace-only abstracts with `HTTP 400 Bad Request`.
   - Paper record created with `source: 'abstract'`, `processingStatus: 'analyzing'`, and `isAnalyzed: false`.
   - Paper Service dispatches asynchronous background POST to AI Service (`http://ai-service:8002/api/ai/analyze`).
   - AI Service executes `nlp_analyzer.py` extracting structured sections, and posts analysis payload back to Paper Service webhook (`/api/papers/:id/analysis`).
   - Paper Service creates `PaperAnalysis` document, updates Paper `isAnalyzed: true`, `processingStatus: 'completed'`.
   - Client polls `/api/papers/:id` every 2 seconds, advances the 4-stage stepper, and transitions to detail view upon completion.

2. **PDF Ingestion & Processing**:
   - Client sends multipart `POST /api/papers/upload` with binary PDF file and metadata.
   - Paper Service streams file directly to MinIO using `@aws-sdk/client-s3` (`PutObjectCommand`), generating key `papers/<userId>/<ts>-<filename>.pdf`.
   - Paper Service calls PDF Service (`http://pdf-service:8001/api/pdf/extract`).
   - PDF Service downloads byte stream from MinIO using Boto3, initializes `fitz.open(stream=...)`.
   - **Corrupt File Guard**: If PyMuPDF throws parsing exceptions, PDF Service sends status update `failed` with descriptive error to Paper Service.
   - **Scanned File Guard**: If total extracted character length is $<50$, PDF Service marks status `completed_without_ai` with message: *"Paper has insufficient extractable text (0 characters). Scanned/image-only PDFs require OCR processing."*
   - Text extracted is sent to AI Service $\rightarrow$ structured analysis saved in MongoDB.
   - Client views PDF via `GET /api/papers/:id/pdf`, which pipes binary stream from MinIO through the Gateway.

---

## 4. Implemented vs. Planned Technology Breakdown (Honest Academic Defense)

| Technology / Dimension | Status in Project | Implementation Details & Evidence |
|---|---|---|
| **Docker Containerization** | **IMPLEMENTED & VERIFIED** | 9 discrete Docker containers running with custom Dockerfiles, non-root users, and isolated bridge network. |
| **Microservice Architecture** | **IMPLEMENTED & VERIFIED** | Auth, Paper, Search, PDF, AI, and Gateway communicate over internal network with service discovery. |
| **API Gateway** | **IMPLEMENTED & VERIFIED** | Express Gateway on port 3000 proxies all traffic, handles JWT headers, and aggregates cluster `/health`. |
| **Object Storage (S3 API)** | **IMPLEMENTED & VERIFIED** | MinIO cluster with pre-seeded `research-papers` bucket; stores binary PDFs with presigned/streaming access. |
| **Document Persistence** | **IMPLEMENTED & VERIFIED** | MongoDB with persistent named volume `mongo-data`; stores users, papers, analyses, bookmarks. |
| **Local Scientific NLP AI** | **IMPLEMENTED & VERIFIED** | `nlp_analyzer.py` deterministic extraction pipeline operating without external API keys. |
| **Academic Graph Search** | **IMPLEMENTED & VERIFIED** | OpenAlex API live query integration with resilient local MongoDB fallback. |
| **External LLM Gateway** | **CONFIGURED / OPTIONAL** | Code supports OpenAI GPT-4o-mini / Groq via `AI_API_KEY`; activates automatically when key is provided. |
| **Kubernetes (k8s) Manifests** | **CONFIGURED / PROTOTYPE** | Deployment, Service, and ConfigMap YAML files present in repository; prototype tested. |
| **Automated CI/CD Pipeline** | **CONFIGURED / PROTOTYPE** | Test scripts (`npm run test:all`, `python test_e2e.py`) verified and structured for GitHub Actions. |
| **Helm Charts & Argo CD** | **PLANNED (Phase 5)** | Helm packaging and GitOps automated synchronization scheduled for Phase 5. |
| **AWS EKS Cloud Deployment** | **PLANNED (Phase 6)** | AWS managed Kubernetes cluster and CloudWatch monitoring scheduled for final deployment phase. |

---

## 5. Anticipated Faculty Questions & Prepared Answers

### Q1: "Is this real AI or are you just returning hardcoded sample strings?"
> **Answer:** *"The analysis is 100% dynamically generated from the input text with zero hardcoded sample strings. We built `nlp_analyzer.py` inside the AI service, which analyzes the submitted paper or abstract text. It identifies section headers, scores sentences using scientific keyword heuristics, extracts quantitative metric findings, isolates limitation clauses, and filters domain terminology. If a faculty member gives us any arbitrary abstract right now during the demo, our platform will analyze that exact text and display its structural breakdown in real-time."*

### Q2: "Why are you using MinIO instead of saving PDFs to the local file system or AWS S3?"
> **Answer:** *"In a cloud-native architecture, microservice containers must remain stateless and disposable. Storing files on a local container filesystem violates the Twelve-Factor App methodology because files are lost when containers restart or scale horizontally. MinIO implements the standard AWS S3 REST API locally. This allows our Paper Service to use the official AWS S3 SDK (`@aws-sdk/client-s3`) without any code changes when migrating to production Amazon S3 on AWS EKS."*

### Q3: "What algorithm does your recommendation system use?"
> **Answer:** *"Our recommendation service implements an explainable Jaccard Index term overlap model:
> $$\text{Similarity}(K_1, K_2) = \frac{|K_1 \cap K_2|}{|K_1 \cup K_2|}$$
> When a researcher inputs an abstract, we extract content keywords by removing academic stopwords ('proposed', 'study', 'approach') and computing term frequency. We then match these against candidate literature in MongoDB, weighting keyword overlap by 70% and research domain alignment by 30%. This gives transparent, explainable recommendations rather than black-box opaque rankings."*

### Q4: "Where is Kubernetes and AWS EKS? Did you deploy this to the cloud?"
> **Answer:** *"We want to be completely honest about our current deployment stage: our platform is currently running on a containerized multi-service Docker Compose architecture. This was intentional for Review-1 and Review-2 to rigorously verify service decoupling, data persistence, network isolation, and error handling locally before incurring AWS cloud infrastructure expenses. Our Kubernetes deployment manifests are written and prototype-tested. Transitioning this architecture to managed AWS EKS with Helm charts and Argo CD GitOps is our documented Phase 5 and Phase 6 milestone."*

### Q5: "What happens if a user uploads a corrupt PDF or a scanned image?"
> **Answer:** *"We specifically tested both edge cases:
> 1. If a corrupt or non-PDF file is uploaded, our PDF Service traps the PyMuPDF parsing exception, logs the diagnostic error, and marks the paper as `failed` in MongoDB without crashing the container.
> 2. If a user uploads a scanned image-only PDF with zero text characters, our service detects the lack of extractable text ($<50$ characters), marks it as `completed_without_ai`, and displays an actionable message advising the user to submit OCR-processed text. This guarantees system stability under adverse inputs."*
