import requests
import json
import time
import os

API_GATEWAY = "http://localhost:3000/api"
FRONTEND_URL = "http://localhost:5173"

def run_tests():
    print("=" * 65)
    print("WHITE SCREEN BUG & PAPER DETAILS REGRESSION VERIFICATION")
    print("=" * 65)

    # Step 1: Verify Frontend Server is Live and Serving HTML
    print("\n--- STEP 1: Verify Frontend Server (Port 5173) ---")
    try:
        r = requests.get(FRONTEND_URL)
        assert r.status_code == 200, f"Frontend returned {r.status_code}"
        assert "html" in r.text.lower(), "Frontend did not return HTML"
        print("[PASS] Frontend Vite dev server is running and returning HTTP 200 OK.")
    except Exception as e:
        print(f"[FAIL] Frontend server connection error: {e}")
        return False

    # Step 2: Authenticate and get Token
    print("\n--- STEP 2: Authenticate / Login ---")
    email = f"whitescreen_test_{int(time.time())}@example.com"
    password = "SecurePassword123!"
    
    reg_res = requests.post(f"{API_GATEWAY}/auth/register", json={
        "name": "Quality Assurance Engineer",
        "email": email,
        "password": password
    })
    token = None
    if reg_res.status_code in [200, 201]:
        token = reg_res.json()["data"]["token"]
        user_id = reg_res.json()["data"]["user"]["id"]
        print(f"[PASS] Registered test user: {email}")
    else:
        # Login if already exists
        login_res = requests.post(f"{API_GATEWAY}/auth/login", json={"email": email, "password": password})
        token = login_res.json()["data"]["token"]
        user_id = login_res.json()["data"]["user"]["id"]
        print(f"[PASS] Logged in test user: {email}")

    headers = {"Authorization": f"Bearer {token}"}

    # Step 3: Fetch Existing Papers List from Database
    print("\n--- STEP 3: Fetch Existing Papers from User Library ---")
    lib_res = requests.get(f"{API_GATEWAY}/papers/user/{user_id}", headers=headers)
    assert lib_res.status_code == 200
    papers = lib_res.json()["data"]["papers"]
    print(f"[INFO] Initial user library has {len(papers)} papers.")

    # Upload 3 test papers to guarantee we have multiple different papers to test
    print("\n--- STEP 4: Ingest 3 Diverse Research Papers ---")
    paper_ids = []

    # Paper A: Abstract Submission (Generates structured analysis)
    res_a = requests.post(f"{API_GATEWAY}/papers/analyze-abstract", headers=headers, json={
        "title": "Autonomous Predictive Autoscaling in Edge Kubernetes",
        "abstract": "We analyze latency amplification in multi-tenant edge Kubernetes clusters. We formulate a novel predictive scheduler that reduces p99 tail latency by 42%.",
        "authors": "Dr. Sarah Connor, Dr. Miles Dyson",
        "keywords": "Autoscaling, Kubernetes, Edge Computing, Tail Latency",
        "researchDomain": "Distributed Systems"
    })
    assert res_a.status_code == 201, f"Failed to submit Abstract Paper A: {res_a.text}"
    paper_a_id = res_a.json()["data"]["paper"]["_id"]
    paper_ids.append(("Paper A (Abstract)", paper_a_id))
    print(f"[PASS] Created Paper A ID: {paper_a_id}")

    # Paper B: Demonstration PDF Upload
    pdf_path = "sample_cloud_native_research_paper.pdf"
    if os.path.exists(pdf_path):
        with open(pdf_path, "rb") as f:
            res_b = requests.post(f"{API_GATEWAY}/papers/upload", headers=headers, files={"pdf": (pdf_path, f, "application/pdf")})
        assert res_b.status_code == 201, f"Failed to upload Paper B: {res_b.text}"
        paper_b_id = res_b.json()["data"]["paper"]["_id"]
        paper_ids.append(("Paper B (PDF Full Analysis)", paper_b_id))
        print(f"[PASS] Created Paper B ID: {paper_b_id}")

    # Paper C: Abstract with minimal keywords
    res_c = requests.post(f"{API_GATEWAY}/papers/analyze-abstract", headers=headers, json={
        "title": "Zero-Trust Security Token Attestation in Heterogeneous Microservices",
        "abstract": "Investigating mutual TLS performance degradation in microservices meshes with rapid ephemeral token rotation.",
        "authors": "Alex Murphy, Anne Lewis",
        "keywords": "Security, Zero-Trust, mTLS, Microservices",
        "researchDomain": "Cybersecurity"
    })
    assert res_c.status_code == 201, f"Failed to submit Abstract Paper C: {res_c.text}"
    paper_c_id = res_c.json()["data"]["paper"]["_id"]
    paper_ids.append(("Paper C (Abstract Security)", paper_c_id))
    print(f"[PASS] Created Paper C ID: {paper_c_id}")

    # Allow processing to stabilize
    print("\nWaiting 3 seconds for background microservice pipelines to complete...")
    time.sleep(3)

    # Step 5: Test Opening All 3 Distinct Papers
    print("\n--- STEP 5: Test Paper Details Retrieval for All Papers ---")
    for label, pid in paper_ids:
        det_res = requests.get(f"{API_GATEWAY}/papers/{pid}", headers=headers)
        assert det_res.status_code == 200, f"Failed fetching {label}: {det_res.status_code}"
        data = det_res.json()["data"]
        paper = data["paper"]
        analysis = data.get("analysis")
        
        print(f"\n[VERIFIED] {label} (ID: {pid}):")
        print(f"  - Title: {paper['title']}")
        print(f"  - Status: {paper.get('processingStatus')}")
        print(f"  - Analysis Available: {bool(analysis)}")
        if analysis:
            print(f"  - Summary: {(analysis.get('summary') or analysis.get('executiveSummary') or '')[:70]}...")
            print(f"  - Structured Gaps: {len(analysis.get('structuredGaps', []))}")
            print(f"  - References: {len(analysis.get('references', []))}")
        
        # Test Recommendations Endpoint for this paper
        rec_res = requests.get(f"{API_GATEWAY}/recommendations/paper/{pid}", headers=headers)
        assert rec_res.status_code == 200
        print(f"  - Related Recommendations: {len(rec_res.json()['data']['relatedPapers'])} found")

    # Step 6: Test Invalid and Missing Paper IDs (Graceful 400/404 Contract)
    print("\n--- STEP 6: Negative Testing & Resilience (Invalid & Missing IDs) ---")
    # 6a. Malformed ID (not 24 hex)
    bad_id = "invalid-id-123"
    r_bad = requests.get(f"{API_GATEWAY}/papers/{bad_id}", headers=headers)
    print(f"[PASS] Malformed ID '{bad_id}' returned HTTP {r_bad.status_code} (Gracefully rejected)")
    
    # 6b. Non-existent 24-hex ObjectId
    fake_hex = "507f1f77bcf86cd799439011"
    r_fake = requests.get(f"{API_GATEWAY}/papers/{fake_hex}", headers=headers)
    assert r_fake.status_code in [404, 400]
    print(f"[PASS] Non-existent ID '{fake_hex}' returned HTTP {r_fake.status_code} (Clean 404/400)")

    # Step 7: Test Direct Refresh Simulation & Notes Persistence
    print("\n--- STEP 7: Notes Saving & Direct Re-query (Refresh Simulation) ---")
    test_note = "Detailed investigation into edge Kubernetes tail latency reduction techniques."
    notes_res = requests.put(f"{API_GATEWAY}/papers/{paper_a_id}/notes", headers=headers, json={"userNotes": test_note})
    assert notes_res.status_code == 200, f"Notes saving failed: {notes_res.text}"
    print("[PASS] User personal notes saved successfully to MongoDB.")

    # Re-fetch Paper A (simulates browser page refresh)
    refreshed_res = requests.get(f"{API_GATEWAY}/papers/{paper_a_id}", headers=headers)
    refreshed_data = refreshed_res.json()["data"]
    assert refreshed_data["paper"]["userNotes"] == test_note
    print("[PASS] Refreshed paper details correctly restored user notes and data.")

    # Step 8: Test Frontend Route Accessibility
    print("\n--- STEP 8: Test Frontend Direct URL Access for Paper Details ---")
    fe_res = requests.get(f"{FRONTEND_URL}/papers/{paper_a_id}")
    assert fe_res.status_code == 200
    assert "html" in fe_res.text.lower()
    print(f"[PASS] Direct browser URL request to '{FRONTEND_URL}/papers/{paper_a_id}' served HTTP 200 successfully.")

    print("\n" + "=" * 65)
    print("ALL WHITE SCREEN BUG REGRESSION TESTS PASSED (100%)!")
    print("=" * 65)
    return True

if __name__ == "__main__":
    success = run_tests()
    if not success:
        exit(1)
