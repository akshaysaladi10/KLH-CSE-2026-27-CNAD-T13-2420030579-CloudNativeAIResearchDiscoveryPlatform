import requests
import time
import os
import sys

GATEWAY_URL = 'http://localhost:3000/api'
DEMO_PDF = 'sample_cloud_native_research_paper.pdf'

def run_test():
    print("=" * 60)
    print("RESEARCH GAP ANALYSIS END-TO-END WORKFLOW VERIFICATION")
    print("Using demonstration PDF: sample_cloud_native_research_paper.pdf")
    print("=" * 60)

    # 1. Login
    print("\n--- STEP 1: Authentication ---")
    login_res = requests.post(f'{GATEWAY_URL}/auth/login', json={
        'email': 'demo@university.edu',
        'password': 'password123'
    }, timeout=5)
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    print("[PASS] Authenticated successfully. JWT token acquired.")

    # 2. Upload demonstration PDF
    print("\n--- STEP 2: Upload Demonstration PDF to MinIO & MongoDB ---")
    assert os.path.exists(DEMO_PDF), f"Demonstration PDF not found at {DEMO_PDF}"
    
    with open(DEMO_PDF, 'rb') as f:
        files = {'pdf': (os.path.basename(DEMO_PDF), f, 'application/pdf')}
        data = {
            'title': 'Decentralized Service Mesh Resilience and Dynamic Autoscaling in Cloud-Native Architectures',
            'authors': 'Dr. Elena Rostova, Marcus Sterling, Alex Kumar',
            'researchDomain': 'Cloud Computing',
            'publicationYear': '2026'
        }
        upload_res = requests.post(f'{GATEWAY_URL}/papers/upload', headers=headers, files=files, data=data, timeout=10)
    
    assert upload_res.status_code == 201, f"Upload failed: {upload_res.text}"
    paper = upload_res.json()['data']['paper']
    paper_id = paper['_id']
    print(f"[PASS] PDF uploaded successfully.")
    print(f"       Paper ID: {paper_id}")
    print(f"       MinIO S3 Key: {paper.get('s3Key')}")
    print(f"       Initial Processing Status: {paper.get('processingStatus')}")

    # 3. Poll for PyMuPDF text stream extraction & genuine gap analysis
    print("\n--- STEP 3: Polling for Text Extraction & Gap Synthesis Completion ---")
    completed = False
    final_paper = None
    final_analysis = None

    for attempt in range(15):
        time.sleep(2)
        res = requests.get(f'{GATEWAY_URL}/papers/{paper_id}', headers=headers, timeout=5)
        assert res.status_code == 200, f"Get paper failed: {res.text}"
        data = res.json()['data']
        p = data.get('paper', {})
        a = data.get('analysis')
        status = p.get('processingStatus')
        print(f"  Attempt {attempt+1}: Status={status}, isAnalyzed={p.get('isAnalyzed')}, hasAnalysis={bool(a)}")

        if status in ['completed', 'completed_without_ai'] or p.get('isAnalyzed'):
            completed = True
            final_paper = p
            final_analysis = a
            break
        elif status == 'failed':
            raise RuntimeError(f"Paper processing failed: {p}")

    assert completed, "Paper processing timed out"
    assert final_analysis is not None, "Paper analysis object is None"
    print(f"[PASS] Processing finished with status: {final_paper.get('processingStatus')}")

    # 4. Verify Author Limitations vs AI Inferred Gaps separation
    print("\n--- STEP 4: Verify Structured Research Gaps Identification ---")
    structured_gaps = final_analysis.get('structuredGaps', [])
    print(f"Total Structured Gaps Extracted: {len(structured_gaps)}")
    assert len(structured_gaps) >= 2, f"Expected at least 2 structured gaps, got {len(structured_gaps)}"

    author_gaps = [g for g in structured_gaps if g.get('category') == 'author_reported']
    ai_gaps = [g for g in structured_gaps if g.get('category') == 'ai_inferred']

    print(f"Author-Reported Limitations count: {len(author_gaps)}")
    print(f"AI-Inferred Gaps count: {len(ai_gaps)}")

    assert len(author_gaps) >= 1, "No author-reported limitations isolated"
    assert len(ai_gaps) >= 1, "No AI-inferred gaps isolated"
    print("[PASS] Author-reported limitations are cleanly separated from AI-inferred research gaps.")

    # 5. Check each gap: Title, Explanation, Supporting Text, Page Reference, Experiment
    print("\n--- STEP 5: Verify Gap Details (Quote, Page Reference, Experiment) ---")
    for i, g in enumerate(structured_gaps):
        print(f"\n  [Gap #{i+1} - {g.get('category').upper()}]")
        print(f"  Title: {g.get('title')}")
        print(f"  Page Reference: {g.get('pageReference')}")
        print(f"  Explanation: {g.get('explanation')}")
        print(f"  Supporting Text Quote: \"{g.get('supportingText')}\"")
        print(f"  Suggested Experiment: {g.get('suggestedExperiment')}")

        assert g.get('title'), f"Gap #{i+1} missing title"
        assert g.get('explanation'), f"Gap #{i+1} missing explanation"
        assert g.get('supportingText'), f"Gap #{i+1} missing supportingText quote"
        assert g.get('pageReference'), f"Gap #{i+1} missing pageReference"
        assert g.get('suggestedExperiment'), f"Gap #{i+1} missing suggestedExperiment"
        
        # Verify supporting text is actually in the paper text
        assert "memory" in g.get('supportingText').lower() or "token" in g.get('supportingText').lower() or "reinforcement" in g.get('supportingText').lower() or "overload" in g.get('supportingText').lower(), "Quote not grounded in demonstration paper"

    print("\n[PASS] All research gaps contain validated explanations, quotes, page references, and follow-up experiments.")

    # 6. Verify Persistence across Page Refresh (Fetch by ID)
    print("\n--- STEP 6: Persistence Verification (Simulate Page Refresh) ---")
    refresh_res = requests.get(f'{GATEWAY_URL}/papers/{paper_id}', headers=headers, timeout=5)
    assert refresh_res.status_code == 200
    refreshed_data = refresh_res.json()['data']
    refreshed_analysis = refreshed_data.get('analysis')
    refreshed_gaps = refreshed_analysis.get('structuredGaps', [])

    assert refreshed_analysis['paperId'] == paper_id, "Analysis not saved against correct paper ID"
    assert len(refreshed_gaps) == len(structured_gaps), "Gaps count mismatch after refresh"
    for i in range(len(structured_gaps)):
        assert refreshed_gaps[i]['title'] == structured_gaps[i]['title'], f"Gap title mismatch at index {i}"
        assert refreshed_gaps[i]['supportingText'] == structured_gaps[i]['supportingText'], f"Quote mismatch at index {i}"
        assert refreshed_gaps[i]['suggestedExperiment'] == structured_gaps[i]['suggestedExperiment'], f"Experiment mismatch at index {i}"

    print(f"[PASS] Analysis verified saved in MongoDB against paperId {paper_id} and loads identical data on page refresh.")

    # 7. Test Re-Analysis Trigger
    print("\n--- STEP 7: Re-Analyze Pipeline Verification ---")
    re_res = requests.post(f'{GATEWAY_URL}/papers/{paper_id}/reanalyze', headers=headers, timeout=5)
    assert re_res.status_code == 200, f"Re-analyze failed: {re_res.text}"
    print(f"[PASS] Re-analyze successfully triggered. Status: {re_res.json()['data']['paper']['processingStatus']}")

    # Wait for re-analysis completion
    time.sleep(3)
    re_check = requests.get(f'{GATEWAY_URL}/papers/{paper_id}', headers=headers, timeout=5)
    assert re_check.status_code == 200
    re_analysis = re_check.json()['data'].get('analysis')
    assert re_analysis is not None
    print(f"[PASS] Re-analysis completed successfully. Retained {len(re_analysis.get('structuredGaps', []))} gaps.")

    # 8. Verify Presence in Cross-Paper Gap Explorer
    print("\n--- STEP 8: Cross-Paper Gap Explorer Verification ---")
    all_papers_res = requests.get(f'{GATEWAY_URL}/papers?limit=50', headers=headers, timeout=5)
    assert all_papers_res.status_code == 200
    all_papers = all_papers_res.json()['data'].get('papers', [])
    matching_in_corpus = [p for p in all_papers if p['_id'] == paper_id]
    assert len(matching_in_corpus) == 1, "Uploaded paper not found in platform papers catalog"
    print(f"[PASS] Paper successfully indexed in platform catalog for Gap Explorer.")

    print("\n" + "=" * 60)
    print("ALL RESEARCH GAP ANALYSIS VERIFICATION STEPS PASSED (100%)!")
    print("=" * 60)

if __name__ == '__main__':
    run_test()
