import fitz

doc = fitz.open()

# Page 1
page1 = doc.new_page(width=612, height=792)
p1_text = """Decentralized Service Mesh Resilience and Dynamic Autoscaling in Cloud-Native Architectures

Authors: Dr. Elena Rostova, Marcus Sterling, Alex Kumar
Affiliation: Cloud-Native Systems Institute & Stanford AI Lab
Published: IEEE Transactions on Cloud Computing, 2026
DOI: 10.1109/TCC.2026.8841920

ABSTRACT
Modern enterprise cloud platforms increasingly migrate monolithic core workloads into microservices deployed across containerized clusters. However, inter-service network partitioning, latency amplification, and cascading failures introduce severe operational bottlenecks. This paper presents an empirical evaluation of decentralized service mesh resilience patterns, automated rate-limiting proxies, and dynamic autoscaling mechanisms under adversarial chaos conditions. Our benchmarks reveal that decentralized circuit breakers and exponential backoff retry policies mitigate service failure cascades by 84% while maintaining sub-15ms P99 latency.

KEYWORDS
Cloud-Native; Microservices; Service Mesh; Kubernetes; Fault Tolerance; API Gateway; Chaos Engineering; Distributed Systems

1. INTRODUCTION & RESEARCH PROBLEM
The proliferation of microservices topologies introduces complex dependency graphs where single-point microservice failures can cascade through upstream ingress controllers and API gateways. Traditional monolithic recovery patterns fail to isolate distributed fault domains effectively. The core challenge addressed in this work is establishing automated, decentralized fault containment without introducing excessive proxy overhead.
"""
page1.insert_text((50, 60), p1_text, fontsize=10, fontname="helv")

# Page 2
page2 = doc.new_page(width=612, height=792)
p2_text = """2. METHODOLOGY & EXPERIMENTAL SETUP
We engineered a synthetic microservices benchmark consisting of 24 polyglot services deployed across a 64-node Kubernetes cluster. Workloads were subjected to chaotic network conditions including:
- Simulated packet loss ranging from 5% to 35%
- Latency injection spikes up to 2500ms
- Sudden volumetric request surges up to 100,000 requests per second

Telemetry was collected at the API gateway layer and sidecar proxies using OpenTelemetry standards.

3. MAJOR FINDINGS & RESULTS
Our quantitative analysis yielded three primary results:
1. Adaptive circuit breakers decoupled downstream bottlenecks, preventing thread pool exhaustion in upstream API gateways.
2. Distributed token-bucket rate limiting at ingress proxies successfully neutralized layer-7 denial-of-service surges.
3. Mean Time to Recovery (MTTR) under chaotic node termination improved from 142 seconds to 18 seconds using automated container rescheduling.

4. LIMITATIONS & RESEARCH GAPS
Current service mesh implementations exhibit non-trivial memory footprints on ultra-dense edge nodes. Additionally, cross-cluster security token rotation introduces cryptographic verification overhead during high connection churn.

5. FUTURE DIRECTIONS
Future research will investigate embedding lightweight reinforcement learning models directly into Envoy-compatible proxy filters to dynamically predict and shed transient microservice overload.
"""
page2.insert_text((50, 60), p2_text, fontsize=10, fontname="helv")

doc.save("/tmp/sample_cloud_native_research_paper.pdf")
doc.close()
print("PDF created in container /tmp/sample_cloud_native_research_paper.pdf")
