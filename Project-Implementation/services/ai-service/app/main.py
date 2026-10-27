from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import logging
import requests
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(dotenv_path='../../.env')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Analysis Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    paperId: str
    text: str

def generate_unconfigured_analysis():
    return {
        "summary": "AI automated analysis is currently unconfigured. To enable live AI analysis of extracted text, please specify a valid AI_API_KEY in your .env configuration (compatible with OpenAI, Groq, Ollama, DeepSeek, or Gemini).",
        "researchProblem": "AI_API_KEY required for automated research problem formulation.",
        "objectives": "Configure AI_API_KEY in .env to automatically extract primary research objectives.",
        "methodology": "Configure AI_API_KEY in .env to inspect methodology and experimental techniques.",
        "majorFindings": [
            "AI automated extraction is pending API key configuration.",
            "Text was successfully extracted by PyMuPDF and is awaiting an active AI provider.",
            "Supports any OpenAI-compatible provider (OpenAI, Groq, DeepSeek, Ollama, Gemini)."
        ],
        "limitations": [
            "Real AI analysis requires active AI credentials."
        ],
        "researchGaps": [
            "AI provider key needed to automatically analyze research gaps."
        ],
        "futureDirections": [
            "Add AI_API_KEY to your .env file and click 'Re-run AI Analysis'."
        ],
        "keywords": [],
        "importantConcepts": [],
        "relatedTopics": [],
        "researchDomain": "Computer Science",
        "aiProvider": "unconfigured"
    }

from app.nlp_analyzer import analyze_scientific_text_local

def analyze_text_background(paper_id: str, text: str):
    paper_service_url = os.environ.get('PAPER_SERVICE_URL') or (
        'http://paper-service:3002' if os.path.exists('/.dockerenv') else 'http://localhost:3002'
    )
    
    # Notify paper service that AI analysis started
    try:
        requests.patch(f"{paper_service_url}/api/papers/{paper_id}/status", json={"status": "analyzing"}, timeout=5)
    except Exception as e:
        logger.warn(f"Could not notify paper-service of status change: {e}")

    api_key = os.environ.get('AI_API_KEY')
    analysis_result = None
    
    # If a real external API key is provided, attempt LLM completion
    if api_key and api_key.strip() not in ['your-ai-api-key', 'mock-api-key-or-real', '']:
        try:
            logger.info("Calling configured OpenAI-compatible API...")
            base_url = os.environ.get('AI_BASE_URL', 'https://api.openai.com/v1')
            model = os.environ.get('AI_MODEL', 'gpt-4o-mini')
            client = OpenAI(api_key=api_key, base_url=base_url)
            
            prompt = f"""
            You are an expert scientific researcher. Analyze the following research paper text and return a JSON object with the following fields:
            - summary: (string) A comprehensive 2-3 paragraph summary of the paper's core contributions.
            - researchProblem: (string) The primary challenge or problem addressed.
            - objectives: (string) The key goals and hypotheses of the research.
            - methodology: (string) The experimental, architectural, or algorithmic methodology applied.
            - majorFindings: (array of strings) The 3 to 6 most critical findings or results.
            - limitations: (array of strings) Identified constraints, threats to validity, or limitations.
            - researchGaps: (array of strings) Open problems or gaps in literature highlighted by the authors.
            - futureDirections: (array of strings) Promising directions for future exploration.
            - keywords: (array of strings) 5 to 10 key technical concepts.
            - importantConcepts: (array of strings) Key architectural or theoretical concepts.
            - relatedTopics: (array of strings) 3 to 5 related research fields.
            - researchDomain: (string) The primary field of study (e.g., Cloud Computing, Machine Learning, Distributed Systems, Cybersecurity).

            Text:
            {text[:25000]}
            """
            
            response = client.chat.completions.create(
                model=model,
                response_format={ "type": "json_object" },
                messages=[
                    {"role": "system", "content": "You are a scientific AI assistant. Output exclusively valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                timeout=45.0
            )
            
            content = response.choices[0].message.content
            analysis_result = json.loads(content)
            analysis_result["aiProvider"] = f"openai-compatible ({model})"
            logger.info(f"AI analysis completed successfully via {model}")
            
        except Exception as e:
            logger.warning(f"AI provider API failed ({str(e)}). Falling back to Local Scientific NLP Engine.")
            analysis_result = analyze_scientific_text_local(text)
            analysis_result["aiProvider"] = "Local Scientific NLP Engine (Extractive Fallback)"
    else:
        logger.info("No external AI_API_KEY set. Executing high-precision Local Scientific NLP Analysis Engine.")
        analysis_result = analyze_scientific_text_local(text)

    # Include extracted fullText so paper record retains extracted text
    analysis_result["fullText"] = text

    # Send results back to Paper Service
    webhook_url = f"{paper_service_url}/api/papers/{paper_id}/analysis"
    try:
        logger.info(f"Saving analysis back to Paper Service: {webhook_url}")
        res = requests.post(webhook_url, json=analysis_result, timeout=10)
        if res.status_code == 200:
            logger.info(f"Successfully saved analysis for {paper_id}")
        else:
            logger.error(f"Failed to save analysis. Status: {res.status_code}, Body: {res.text}")
    except Exception as e:
        logger.error(f"Error calling Paper Service webhook: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ai-service"}

@app.post("/api/ai/analyze")
async def analyze_paper(req: AnalyzeRequest, background_tasks: BackgroundTasks):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is required for analysis")
    background_tasks.add_task(analyze_text_background, req.paperId, req.text.strip())
    return {
        "success": True,
        "message": "AI Analysis started in background",
        "paperId": req.paperId
    }
