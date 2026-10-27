from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import fitz  # PyMuPDF
import boto3
import tempfile
import requests
import logging
from dotenv import load_dotenv

load_dotenv(dotenv_path='../../.env')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="PDF Processing Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExtractRequest(BaseModel):
    paperId: str
    s3Key: str
    pdfUrl: str

def get_s3_client():
    is_local = os.environ.get('MINIO_ENDPOINT') is not None
    
    if is_local:
        endpoint_url = f"http://{os.environ.get('MINIO_ENDPOINT', 'localhost')}:{os.environ.get('MINIO_PORT', '9000')}"
        return boto3.client(
            's3',
            endpoint_url=endpoint_url,
            aws_access_key_id=os.environ.get('MINIO_ACCESS_KEY', 'minioadmin'),
            aws_secret_access_key=os.environ.get('MINIO_SECRET_KEY', 'minioadmin'),
            region_name='us-east-1'
        )
    else:
        return boto3.client(
            's3',
            region_name=os.environ.get('AWS_REGION', 'ap-south-1'),
            aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
        )

def process_pdf_background(paper_id: str, s3_key: str):
    logger.info(f"Starting PDF processing for paper {paper_id}")
    paper_service_url = os.environ.get('PAPER_SERVICE_URL', 'http://paper-service:3002' if os.environ.get('MINIO_ENDPOINT') == 'minio' else 'http://localhost:3002')
    
    # Notify paper service that extraction started
    try:
        requests.patch(f"{paper_service_url}/api/papers/{paper_id}/status", json={"status": "extracting"}, timeout=5)
    except Exception as e:
        logger.warn(f"Could not notify paper-service of status change: {e}")

    s3 = get_s3_client()
    bucket = os.environ.get('MINIO_BUCKET', 'research-papers') if os.environ.get('MINIO_ENDPOINT') else os.environ.get('AWS_S3_BUCKET', 'research-platform-pdfs')
    
    # Create temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp_name = tmp.name
        
    try:
        logger.info(f"Downloading {s3_key} from {bucket}")
        s3.download_file(bucket, s3_key, tmp_name)
        
        # Extract text using PyMuPDF
        text = ""
        try:
            with fitz.open(tmp_name) as doc:
                if len(doc) == 0:
                    raise ValueError("PDF contains 0 pages or is corrupt")
                num_pages = min(len(doc), 25)
                for page_num in range(num_pages):
                    page = doc.load_page(page_num)
                    page_text = page.get_text()
                    if page_text:
                        text += f"\n--- Page {page_num + 1} ---\n" + page_text
        except Exception as parse_err:
            logger.error(f"Malformed or corrupt PDF structure for {paper_id}: {parse_err}")
            try:
                requests.patch(f"{paper_service_url}/api/papers/{paper_id}/status", json={"status": "failed"}, timeout=5)
                requests.post(f"{paper_service_url}/api/papers/{paper_id}/analysis", json={
                    "summary": f"PDF parsing error: {str(parse_err)}. The uploaded file appears to be corrupted, malformed, or has an invalid PDF structure.",
                    "researchProblem": "Corrupted or Malformed PDF Document",
                    "objectives": "Please verify the PDF file integrity and upload an undamaged scientific PDF.",
                    "methodology": "PyMuPDF parser was unable to reconstruct document page catalogs or content streams.",
                    "majorFindings": ["Document structure verification failed."],
                    "limitations": ["File structure invalid or corrupted."],
                    "researchGaps": [],
                    "futureDirections": ["Re-upload a verified, non-corrupted research paper PDF."],
                    "keywords": ["Malformed PDF", "Corrupt File"],
                    "aiProvider": "failed"
                }, timeout=5)
            except Exception:
                pass
            return

        clean_text = text.strip()
        logger.info(f"Extracted {len(clean_text)} characters from {paper_id}")
        
        # Check for scanned or image-only PDFs with insufficient text
        if len(clean_text) < 50:
            logger.warning(f"Paper {paper_id} has insufficient extractable text ({len(clean_text)} characters).")
            try:
                requests.patch(f"{paper_service_url}/api/papers/{paper_id}/status", json={"status": "completed_without_ai"}, timeout=5)
                requests.post(f"{paper_service_url}/api/papers/{paper_id}/analysis", json={
                    "summary": "Scanned or image-only PDF detected. The document contains insufficient readable text streams for automated AI synthesis. Please upload a text-based PDF or paste the abstract directly into the Abstract Analysis interface.",
                    "researchProblem": "Scanned or rasterized document without extractable text streams.",
                    "objectives": "Upload a digital native, text-selectable PDF or submit the abstract directly.",
                    "methodology": "PyMuPDF text stream extraction evaluated all pages and detected fewer than 50 text characters.",
                    "majorFindings": [
                        "Document contains rasterized/scanned page images without embedded text streams.",
                        "No selectable font glyphs or Unicode characters could be extracted."
                    ],
                    "limitations": ["Image-only and scanned PDFs require OCR preprocessing or direct text submission."],
                    "researchGaps": [],
                    "futureDirections": ["Use the 'Submit Research Abstract' interface to analyze this paper directly."],
                    "keywords": ["Scanned PDF", "Image Document"],
                    "aiProvider": "not_configured"
                }, timeout=5)
            except Exception:
                pass
            return
        
        # Send to AI Service
        ai_service_url = os.environ.get('AI_SERVICE_URL', 'http://ai-service:8002' if os.environ.get('MINIO_ENDPOINT') == 'minio' else 'http://localhost:8002')
        logger.info(f"Sending text to AI Service at {ai_service_url}/api/ai/analyze")
        
        response = requests.post(f"{ai_service_url}/api/ai/analyze", json={
            "paperId": paper_id,
            "text": clean_text[:35000] # Pass substantial text for thorough AI extraction
        }, timeout=45)
        
        if response.status_code != 200:
            logger.error(f"AI Service error: {response.text}")
        else:
            logger.info(f"Successfully triggered AI analysis for {paper_id}")
            
    except Exception as e:
        logger.error(f"Error processing PDF for {paper_id}: {str(e)}")
        try:
            requests.patch(f"{paper_service_url}/api/papers/{paper_id}/status", json={"status": "failed"}, timeout=5)
        except Exception:
            pass
    finally:
        if os.path.exists(tmp_name):
            os.remove(tmp_name)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "pdf-service"}

@app.post("/api/pdf/extract")
async def extract_text(req: ExtractRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(process_pdf_background, req.paperId, req.s3Key)
    return {
        "success": True,
        "message": "Text extraction started in background",
        "paperId": req.paperId
    }
