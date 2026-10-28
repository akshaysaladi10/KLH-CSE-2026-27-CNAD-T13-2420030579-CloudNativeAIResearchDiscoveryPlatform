import requests
import json
import time

GATEWAY_URL = "https://figure-tri-later-permissions.trycloudflare.com/api"

def test_public_flow():
    print("=" * 60)
    print("TESTING PUBLIC CLOUD-NATIVE API GATEWAY LIVE")
    print("URL:", GATEWAY_URL)
    print("=" * 60)

    # 1. Health check
    h = requests.get(GATEWAY_URL.replace("/api", "/health"), timeout=10)
    print("[1] Health Check Status:", h.status_code)
    assert h.status_code == 200, "Health check failed"
    h_data = h.json()
    print("    Downstream Services:", list(h_data.get("services", {}).keys()))

    # 2. Register / Login test user
    email = f"professor_demo_{int(time.time())}@university.edu"
    reg = requests.post(f"{GATEWAY_URL}/auth/register", json={
        "name": "Prof. Alan Turing",
        "email": email,
        "password": "ResearchExcellence2026!"
    }, timeout=10)
    print("[2] Registration Status:", reg.status_code)
    assert reg.status_code in [200, 201], f"Registration failed: {reg.text}"
    token = reg.json()["data"]["token"]
    user_id = reg.json()["data"]["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}
    print("    Authenticated as:", reg.json()["data"]["user"]["email"])

    # 3. Submit Abstract Paper
    abs_res = requests.post(f"{GATEWAY_URL}/papers/analyze-abstract", headers=headers, json={
        "title": "Decentralized Service Mesh Resilience in Edge Kubernetes",
        "abstract": "We evaluate memory consumption of Envoy proxies on edge nodes and propose a predictive scaling algorithm that sheds transient microservice overload.",
        "authors": "Prof. Alan Turing",
        "keywords": "Edge Computing, Service Mesh, Autoscaling",
        "researchDomain": "Distributed Systems"
    }, timeout=15)
    print("[3] Abstract Ingestion Status:", abs_res.status_code)
    assert abs_res.status_code == 201, f"Ingestion failed: {abs_res.text}"
    paper_id = abs_res.json()["data"]["paper"]["_id"]
    print("    Created Paper ID:", paper_id)

    # 4. Fetch Paper Details through Public Gateway
    det_res = requests.get(f"{GATEWAY_URL}/papers/{paper_id}", headers=headers, timeout=10)
    print("[4] Fetch Paper Details Status:", det_res.status_code)
    assert det_res.status_code == 200
    paper_obj = det_res.json()["data"]["paper"]
    print("    Paper Title:", paper_obj["title"])
    print("    Processing Status:", paper_obj.get("processingStatus"))

    # 5. Fetch Related Recommendations
    rec_res = requests.get(f"{GATEWAY_URL}/recommendations/paper/{paper_id}", headers=headers, timeout=10)
    print("[5] Recommendations Retrieval Status:", rec_res.status_code)
    assert rec_res.status_code == 200
    print("    Related Papers Found:", len(rec_res.json()["data"].get("relatedPapers", [])))

    print("\n" + "=" * 60)
    print("ALL PUBLIC API GATEWAY VERIFICATION TESTS PASSED (100%)!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    test_public_flow()
