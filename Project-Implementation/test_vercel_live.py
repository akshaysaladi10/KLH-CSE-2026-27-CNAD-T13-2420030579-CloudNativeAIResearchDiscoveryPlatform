import requests
import json
import time

VERCEL_URL = "https://frontend-nine-kappa-55.vercel.app"
API_URL = "https://figure-tri-later-permissions.trycloudflare.com/api"
GATEWAY_HEALTH = "https://figure-tri-later-permissions.trycloudflare.com/health"

def test_vercel_live():
    print("=" * 65)
    print("VERCEL PRODUCTION DEPLOYMENT & API CONNECTIVITY VERIFICATION")
    print("=" * 65)

    # 1. Test Vercel Root URL
    print("\n--- 1. Testing Vercel Public Root ---")
    r1 = requests.get(VERCEL_URL, timeout=10)
    assert r1.status_code == 200, f"Root returned {r1.status_code}"
    assert "html" in r1.text.lower(), "Root didn't return HTML"
    print(f"[PASS] Vercel Website Live: {VERCEL_URL} (HTTP 200 OK)")

    # 2. Test SPA Routing & Deep Links (No 404s on Refresh)
    print("\n--- 2. Testing SPA Routing & Deep Route Rewrites ---")
    routes = [
        "/dashboard",
        "/library",
        "/upload",
        "/gaps",
        "/papers/6ae1853db810e95ed6228424",
        "/compare",
        "/settings"
    ]
    for route in routes:
        r = requests.get(f"{VERCEL_URL}{route}", timeout=10)
        assert r.status_code == 200, f"Route {route} returned {r.status_code}"
        assert "html" in r.text.lower(), f"Route {route} didn't return HTML"
        print(f"[PASS] Route '{route}' loads successfully (HTTP 200 OK)")

    # 3. Test API Gateway Cluster Health
    print("\n--- 3. Testing Public API Gateway & Downstream Microservices ---")
    rh = requests.get(GATEWAY_HEALTH, timeout=10)
    assert rh.status_code == 200, f"Health check failed: {rh.status_code}"
    health_data = rh.json()
    print(f"[PASS] API Gateway Status: {health_data.get('status')}")
    services = health_data.get("services", {})
    for name, s_data in services.items():
        print(f"       - Microservice '{name}': {s_data.get('status')} (reachable: {s_data.get('reachable')})")

    # 4. Test CORS Preflight from Vercel Domain
    print("\n--- 4. Testing CORS Policy for Vercel Origin ---")
    cors_res = requests.options(f"{API_URL}/auth/login", headers={
        "Origin": VERCEL_URL,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, Authorization"
    }, timeout=10)
    assert cors_res.status_code == 204, f"CORS Preflight failed: {cors_res.status_code}"
    assert cors_res.headers.get("Access-Control-Allow-Origin") == VERCEL_URL, "CORS origin mismatch"
    print(f"[PASS] CORS headers verified for origin: {VERCEL_URL}")

    # 5. Live End-to-End User Flow (Auth + Ingestion + Details)
    print("\n--- 5. End-to-End User Workflow over Public Endpoints ---")
    test_user = f"professor_audit_{int(time.time())}@university.edu"
    auth_res = requests.post(f"{API_URL}/auth/register", json={
        "name": "Prof. Turing Verification",
        "email": test_user,
        "password": "ResearchSecurity2026!"
    }, timeout=10)
    assert auth_res.status_code in [200, 201], f"Auth failed: {auth_res.text}"
    token = auth_res.json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[PASS] User authenticated: {test_user}")

    # Submit Research Paper Abstract
    paper_res = requests.post(f"{API_URL}/papers/analyze-abstract", headers=headers, json={
        "title": "Scalable Microservice Fault Isolation in Hybrid Clouds",
        "abstract": "We evaluate cascading failure containment in enterprise cloud-native environments. Our asynchronous circuit breaker prevents 99.8% of upstream outage propagation.",
        "authors": "Prof. Turing Verification",
        "keywords": "Microservices, Fault Tolerance, Circuit Breaker, Cloud Native",
        "researchDomain": "Distributed Systems"
    }, timeout=15)
    assert paper_res.status_code == 201, f"Paper submission failed: {paper_res.text}"
    paper_id = paper_res.json()["data"]["paper"]["_id"]
    print(f"[PASS] Paper ingested. ID: {paper_id}")

    # Verify Paper Details Retrieval
    det_res = requests.get(f"{API_URL}/papers/{paper_id}", headers=headers, timeout=10)
    assert det_res.status_code == 200
    paper_data = det_res.json()["data"]["paper"]
    print(f"[PASS] Retrieved Paper: '{paper_data['title']}' (Status: {paper_data.get('processingStatus')})")

    # Verify Related Papers Recommendation
    rec_res = requests.get(f"{API_URL}/recommendations/paper/{paper_id}", headers=headers, timeout=10)
    assert rec_res.status_code == 200
    print(f"[PASS] Recommendations retrieved: {len(rec_res.json()['data'].get('relatedPapers', []))} relevant papers found")

    print("\n" + "=" * 65)
    print("ALL VERCEL LIVE DEPLOYMENT VERIFICATION CHECKS PASSED (100%)!")
    print("=" * 65)
    return True

if __name__ == "__main__":
    test_vercel_live()
