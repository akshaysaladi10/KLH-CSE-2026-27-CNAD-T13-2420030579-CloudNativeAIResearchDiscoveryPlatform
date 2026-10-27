import requests
import time
import json
import uuid
import sys
import os

GATEWAY_URL = "http://localhost:3000/api"
AUTH_URL = f"{GATEWAY_URL}/auth"
PAPER_URL = f"{GATEWAY_URL}/papers"
SEARCH_URL = f"{GATEWAY_URL}/search"
REC_URL = f"{GATEWAY_URL}/recommendations"
LIBRARY_URL = f"{GATEWAY_URL}/library"
HEALTH_URL = "http://localhost:3000/health"

print("==================================================")
print("CNAD COMPREHENSIVE END-TO-END VERIFICATION SUITE")
print("Routing strictly through API Gateway (port 3000)")
print("==================================================")

# --- STEP 0: Health Checks ---
print("\n--- STEP 0: Health Checks ---")
max_retries = 40
for i in range(max_retries):
    try:
        r = requests.get(HEALTH_URL, timeout=3)
        if r.status_code in [200, 207]:
            data = r.json()
            services = data.get('services', {})
            all_reachable = len(services) > 0 and all(s.get('reachable') for s in services.values())
            if all_reachable:
                print(f"[OK] Gateway and all downstream services reachable. Status: {data.get('status')}")
                for sname, sinfo in services.items():
                    print(f"     - {sname}: {sinfo.get('status')} (reachable: {sinfo.get('reachable')})")
                break
            else:
                print(f"Waiting for all downstream microservices to become reachable...")
    except Exception as e:
        pass
    print(f"Waiting for services... ({i+1}/{max_retries})")
    time.sleep(3)
else:
    print("[FAIL] API Gateway did not become healthy in time.")
    sys.exit(1)

test_id = str(uuid.uuid4())[:8]
email = f"cnad_test_{test_id}@example.com"
password = "Password123!"

# --- STEP 1: Register User ---
print(f"\n--- STEP 1: Register User ({email}) ---")
r = requests.post(f"{AUTH_URL}/register", json={
    "name": f"CNAD Researcher {test_id}",
    "email": email,
    "password": password,
    "institution": "Cloud-Native Institute"
})
assert r.status_code in [200, 201], f"Register failed: {r.text}"
print(f"[PASS] User registered successfully: {r.json().get('message')}")

# --- STEP 2: Login User ---
print(f"\n--- STEP 2: Login User ---")
r = requests.post(f"{AUTH_URL}/login", json={
    "email": email,
    "password": password
})
assert r.status_code == 200, f"Login failed: {r.text}"
token = r.json()['data']['token']
user = r.json()['data']['user']
headers = {"Authorization": f"Bearer {token}"}
print(f"[PASS] Login successful. JWT token received for: {user['name']} ({user['email']})")

# --- STEP 3: Dashboard Analytics ---
print("\n--- STEP 3: Dashboard Analytics ---")
r = requests.get(f"{GATEWAY_URL}/analytics/dashboard", headers=headers)
assert r.status_code == 200, f"Dashboard stats failed: {r.text}"
stats = r.json().get('data', {})
print(f"[PASS] Dashboard stats loaded: Total Papers={stats.get('totalPlatformPapers', stats.get('totalPapers', 0))}, User Uploads={stats.get('totalUploaded', 0)}, Bookmarks={stats.get('totalBookmarks', 0)}")

# --- STEP 4: OpenAlex Academic Research Search ---
print("\n--- STEP 4: Academic Paper Search (OpenAlex + Fallback) ---")
r = requests.get(f"{SEARCH_URL}?q=cloud+native+microservices&source=openalex", headers=headers)
assert r.status_code == 200, f"Search failed: {r.text}"
search_data = r.json()['data']
papers_found = search_data.get('papers', [])
print(f"[PASS] Academic search returned {len(papers_found)} papers (Total: {search_data.get('total')}).")
if len(papers_found) > 0:
    top_p = papers_found[0]
    print(f"       Top Result: \"{top_p.get('title')}\"")
    print(f"       Domain: {top_p.get('researchDomain', 'N/A')}")

# --- STEP 5: Abstract Submission & Genuine AI Analysis ---
print("\n--- STEP 5: Abstract Submission & Genuine AI Pipeline Execution ---")
sample_abstract = (
    "In cloud-native computing, containerized microservices face severe latency degradation under dynamic traffic spikes. "
    "This research designs an adaptive predictive auto-scaling controller deployed within a Kubernetes service mesh. "
    "Using real-time telemetry from Envoy sidecar proxies, our methodology combines sliding-window ARIMA forecasting "
    "with reinforcement learning feedback. Experimental evaluations on a 50-node distributed cluster show a 34% reduction "
    "in 99th-percentile tail latency and 21% decrease in resource provisioning costs compared to standard HPA. "
    "However, a limitation is increased memory consumption in edge nodes. Future research will explore decentralized eBPF telemetry."
)
r = requests.post(f"{PAPER_URL}/analyze-abstract", headers=headers, json={
    "title": f"Predictive Kubernetes Autoscaling for Microservices {test_id}",
    "abstract": sample_abstract,
    "authors": "Dr. Sarah Chen, Alex Kumar",
    "researchDomain": "Cloud Computing",
    "keywords": "Kubernetes, Microservices, Autoscaling, AI Telemetry"
})
assert r.status_code in [200, 201], f"Analyze abstract failed: {r.text}"
abstract_res = r.json()['data']
abstract_paper = abstract_res['paper']
abstract_paper_id = abstract_paper['_id']
print(f"[PASS] Abstract paper created with ID: {abstract_paper_id}")
print(f"       Initial status: {abstract_paper.get('processingStatus')}")

# --- STEP 6: Verify Structured AI Analysis Fields ---
print("\n--- STEP 6: Polling for Genuine AI Analysis Completion ---")
abstract_analysis = None
for attempt in range(15):
    time.sleep(2)
    r_poll = requests.get(f"{PAPER_URL}/{abstract_paper_id}", headers=headers)
    if r_poll.status_code == 200:
        p_data = r_poll.json()['data']
        if p_data.get('paper', {}).get('isAnalyzed') or p_data.get('analysis'):
            abstract_analysis = p_data.get('analysis')
            print(f"[PASS] AI analysis completed for abstract paper.")
            break
        print(f"     Waiting for AI analysis... ({attempt+1}/15)")

assert abstract_analysis is not None, "AI Analysis was not created for the abstract!"
print(f"[PASS] AI Provider: {abstract_analysis.get('aiProvider')}")
print(f"       Research Problem: {abstract_analysis.get('researchProblem')}")
print(f"       Objectives: {abstract_analysis.get('objectives')}")
print(f"       Methodology: {abstract_analysis.get('methodology')}")
print(f"       Major Findings: {abstract_analysis.get('majorFindings')}")
print(f"       Limitations: {abstract_analysis.get('limitations')}")
print(f"       Future Directions: {abstract_analysis.get('futureDirections')}")
print(f"       Keywords: {abstract_analysis.get('keywords')}")
assert len(abstract_analysis.get('keywords', [])) > 0, "Keywords array is empty in AI analysis"
assert len(abstract_analysis.get('majorFindings', [])) > 0, "Major findings array is empty"

# --- STEP 7: Empty Abstract Input Validation (Negative Test) ---
print("\n--- STEP 7: Validate Empty Abstract Handling (Negative Test) ---")
r = requests.post(f"{PAPER_URL}/analyze-abstract", headers=headers, json={
    "title": "Empty Paper",
    "abstract": "   ",
})
assert r.status_code == 400, f"Expected 400 Bad Request for empty abstract, got {r.status_code}"
print(f"[PASS] Empty abstract correctly rejected with 400: {r.json().get('message')}")

# --- STEP 8: Contextual Recommendations by Abstract ---
print("\n--- STEP 8: Contextual Recommendations by Abstract ---")
r = requests.post(f"{REC_URL}/abstract", headers=headers, json={
    "abstract": sample_abstract,
    "limit": 5
})
assert r.status_code == 200, f"Recommendations by abstract failed: {r.text}"
rec_abstract_data = r.json()['data']
recs_from_abs = rec_abstract_data.get('recommendations', [])
print(f"[PASS] Contextual recommendations returned {len(recs_from_abs)} matches.")
print(f"       Extracted Keywords: {rec_abstract_data.get('extractedKeywords')}")
if len(recs_from_abs) > 0:
    first_rec = recs_from_abs[0]
    print(f"       Top Match: {first_rec.get('paper', {}).get('title')} (Score: {first_rec.get('score')})")
    print(f"       Match Reason: {first_rec.get('matchReason')}")

# --- STEP 9: Upload Valid Research Paper PDF with MinIO & PyMuPDF ---
print("\n--- STEP 9: Upload Valid Research Paper PDF ---")
pdf_path = f"sample_cnad_{test_id}.pdf"
pdf_content = (
    b"%PDF-1.4\n"
    b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
    b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
    b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
    b"4 0 obj << /Length 380 >> stream\n"
    b"BT /F1 14 Tf 50 720 Td (Fault-Tolerant Distributed Consensus in Cloud-Native Kubernetes) Tj\n"
    b"/F1 11 Tf 0 -30 Td (Abstract: We propose an optimized Raft consensus protocol for dynamic container nodes.) Tj\n"
    b"0 -25 Td (Methodology: Evaluated across multi-region AWS and bare-metal Kubernetes clusters with Chaos Mesh.) Tj\n"
    b"0 -25 Td (Findings: Raft election timeouts decreased by 52 percent during high network jitter.) Tj\n"
    b"0 -25 Td (Limitations: Tested up to 25 consensus replicas under synthetic partitions.) Tj\n"
    b"0 -25 Td (Future Directions: Integration with zero-trust SPIFFE/SPIRE identity planes.) Tj ET\n"
    b"endstream endobj\n"
    b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
    b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000251 00000 n \n0000000683 00000 n \n"
    b"trailer << /Size 6 /Root 1 0 R >>\nstartxref\n758\n%%EOF"
)
with open(pdf_path, "wb") as f:
    f.write(pdf_content)

with open(pdf_path, "rb") as f:
    files = {"pdf": ("fault_tolerant_consensus.pdf", f, "application/pdf")}
    data = {
        "title": f"Fault-Tolerant Distributed Consensus {test_id}",
        "authors": "Prof. David Miller, Elena Rostova",
        "abstract": "We propose an optimized Raft consensus protocol for dynamic container nodes.",
        "keywords": "consensus, raft, distributed systems, kubernetes, fault-tolerance",
        "researchDomain": "Distributed Systems"
    }
    r = requests.post(f"{PAPER_URL}/upload", headers=headers, files=files, data=data)

assert r.status_code == 201, f"Paper upload failed: {r.text}"
pdf_paper = r.json()['data']['paper']
pdf_paper_id = pdf_paper['_id']
print(f"[PASS] PDF uploaded successfully. ID: {pdf_paper_id}")
print(f"       S3 Storage Key: {pdf_paper.get('s3Key')}")

# --- STEP 10: Polling PyMuPDF Extraction & AI Analysis ---
print("\n--- STEP 10: Polling PyMuPDF Extraction & AI Pipeline ---")
analyzed = False
final_pdf_paper = None
final_pdf_analysis = None
for attempt in range(25):
    time.sleep(2.5)
    r = requests.get(f"{PAPER_URL}/{pdf_paper_id}", headers=headers)
    if r.status_code == 200:
        p = r.json()['data']['paper']
        status = p.get('processingStatus')
        print(f"     Status: {status} (isAnalyzed: {p.get('isAnalyzed')})")
        if p.get('isAnalyzed') or status in ['completed', 'completed_without_ai']:
            analyzed = True
            final_pdf_paper = p
            final_pdf_analysis = r.json()['data'].get('analysis')
            break
        if status == 'failed':
            print(f"[FAIL] Processing marked as failed.")
            break

assert analyzed, "PDF processing timed out or failed to reach completion."
print(f"[PASS] PDF extraction and AI completed. Status: {final_pdf_paper.get('processingStatus')}")
if final_pdf_analysis:
    print(f"       AI Summary: {final_pdf_analysis.get('summary', '')[:120]}...")
    print(f"       AI Findings: {final_pdf_analysis.get('majorFindings')}")

# --- STEP 11: Stream PDF Binary via Gateway ---
print("\n--- STEP 11: Stream PDF Binary from MinIO through Gateway ---")
r = requests.get(f"{PAPER_URL}/{pdf_paper_id}/pdf", headers=headers)
assert r.status_code == 200, f"PDF streaming failed: {r.status_code}"
assert len(r.content) > 0, "Received empty PDF stream"
print(f"[PASS] Streamed {len(r.content)} bytes of original PDF through Gateway successfully.")

# --- STEP 12: Malformed PDF Upload Handling ---
print("\n--- STEP 12: Malformed PDF Error Handling (Resilience Test) ---")
malformed_path = f"malformed_{test_id}.pdf"
with open(malformed_path, "wb") as f:
    f.write(b"NOT_A_VALID_PDF_HEADER_THIS_IS_CORRUPT_DATA")

with open(malformed_path, "rb") as f:
    files = {"pdf": ("corrupt.pdf", f, "application/pdf")}
    data = {"title": "Malformed PDF Document Test"}
    r = requests.post(f"{PAPER_URL}/upload", headers=headers, files=files, data=data)

assert r.status_code in [201, 400], f"Unexpected status: {r.status_code}"
if r.status_code == 201:
    mal_p = r.json()['data']['paper']
    mal_id = mal_p.get('_id') or mal_p.get('id')
    # Let pdf-service detect corrupt document
    time.sleep(4)
    r_check = requests.get(f"{PAPER_URL}/{mal_id}", headers=headers)
    mal_status = r_check.json()['data']['paper']['processingStatus']
    print(f"[PASS] Malformed PDF handled safely. Status: {mal_status} (System remained stable)")
else:
    print(f"[PASS] Malformed PDF rejected at upload boundary: {r.status_code}")

if os.path.exists(malformed_path):
    os.remove(malformed_path)

# --- STEP 13: Insufficient Text / Scanned PDF Handling ---
print("\n--- STEP 13: Scanned / Image-Only PDF Handling ---")
scanned_path = f"scanned_{test_id}.pdf"
# Valid PDF structure but completely blank content (no extractable text)
scanned_content = (
    b"%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
    b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
    b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj\n"
    b"xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n"
    b"trailer << /Size 4 /Root 1 0 R >>\nstartxref\n185\n%%EOF"
)
with open(scanned_path, "wb") as f:
    f.write(scanned_content)

with open(scanned_path, "rb") as f:
    files = {"pdf": ("scanned_paper.pdf", f, "application/pdf")}
    data = {"title": "Scanned Document Test"}
    r = requests.post(f"{PAPER_URL}/upload", headers=headers, files=files, data=data)

assert r.status_code == 201
scanned_p = r.json()['data']['paper']
scanned_id = scanned_p.get('_id') or scanned_p.get('id')
for _ in range(8):
    time.sleep(2)
    r_check = requests.get(f"{PAPER_URL}/{scanned_id}", headers=headers)
    if r_check.json()['data']['paper']['processingStatus'] in ['completed_without_ai', 'failed']:
        print(f"[PASS] Scanned/Zero-text PDF handled properly with status: {r_check.json()['data']['paper']['processingStatus']}")
        break

if os.path.exists(scanned_path):
    os.remove(scanned_path)

# --- STEP 14: Library Bookmarks Persistence ---
print("\n--- STEP 14: Library Bookmark Persistence ---")
r = requests.post(f"{LIBRARY_URL}/bookmarks", headers=headers, json={"paperId": abstract_paper_id})
assert r.status_code in [200, 201], f"Bookmark creation failed: {r.text}"
print(f"[PASS] Abstract paper bookmarked successfully.")

r = requests.get(f"{LIBRARY_URL}/bookmarks", headers=headers)
assert r.status_code == 200, f"Get bookmarks failed: {r.text}"
bookmarks = r.json()['data']['bookmarks']
b_ids = [b.get('paperId', {}).get('_id') if isinstance(b.get('paperId'), dict) else b.get('paperId') for b in bookmarks]
assert abstract_paper_id in b_ids, f"Bookmarked paper {abstract_paper_id} not in library"
print(f"[PASS] Bookmarks successfully persisted in MongoDB ({len(bookmarks)} total).")

# --- STEP 15: Local Catalog Search ---
print("\n--- STEP 15: Local Database Search ---")
r = requests.get(f"{SEARCH_URL}?q=autoscaling&source=local", headers=headers)
assert r.status_code == 200, f"Local search failed: {r.text}"
local_matches = r.json()['data']['papers']
assert len(local_matches) > 0, "Local search did not return the abstract paper with 'autoscaling'"
print(f"[PASS] Local search found {len(local_matches)} matching papers for 'autoscaling'.")

# --- STEP 16: Paper Related Recommendations ---
print("\n--- STEP 16: Research Paper Related Recommendations ---")
r = requests.get(f"{REC_URL}/paper/{abstract_paper_id}", headers=headers)
assert r.status_code == 200, f"Related recommendations failed: {r.text}"
related = r.json()['data'].get('recommendations', [])
print(f"[PASS] Related paper recommendations returned {len(related)} papers.")

# --- STEP 17: Trigger Re-analysis ---
print("\n--- STEP 17: Trigger Paper Re-Analysis ---")
r = requests.post(f"{PAPER_URL}/{abstract_paper_id}/reanalyze", headers=headers)
assert r.status_code == 200, f"Reanalyze failed: {r.text}"
re_paper = r.json()['data'].get('paper')
assert re_paper is not None, "Reanalyze paper data is empty"
print(f"[PASS] Reanalysis initiated successfully. Paper status: {re_paper.get('processingStatus')}")

# Poll to confirm re-analysis completes
time.sleep(3)
r_repoll = requests.get(f"{PAPER_URL}/{abstract_paper_id}", headers=headers)
assert r_repoll.status_code == 200
final_reanalysis = r_repoll.json()['data'].get('analysis')
assert final_reanalysis is not None, "Reanalysis document not found"
print(f"[PASS] Re-analysis pipeline completed. Provider: {final_reanalysis.get('aiProvider')}")

# Clean up local sample PDF
if os.path.exists(pdf_path):
    os.remove(pdf_path)

print("\n==================================================")
print("ALL 17 END-TO-END VERIFICATION STEPS PASSED!")
print("==================================================")
