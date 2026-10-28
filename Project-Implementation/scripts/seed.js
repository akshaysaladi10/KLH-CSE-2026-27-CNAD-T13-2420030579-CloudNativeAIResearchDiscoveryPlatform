const path = require('path');
let dotenv;
try {
  dotenv = require('dotenv');
} catch {
  dotenv = require('../services/auth-service/node_modules/dotenv');
}
dotenv.config({ path: path.resolve(__dirname, '../.env') });

let mongoose;
try {
  mongoose = require('mongoose');
} catch {
  mongoose = require('../services/auth-service/node_modules/mongoose');
}

let bcrypt;
try {
  bcrypt = require('bcryptjs');
} catch {
  bcrypt = require('../services/auth-service/node_modules/bcryptjs');
}

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: 'researcher' },
    institution: { type: String, default: '' },
    researchInterests: [String],
  },
  { timestamps: true }
);

const PaperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    authors: [{ name: String, affiliation: String }],
    abstract: { type: String, default: '' },
    publicationYear: Number,
    journal: String,
    doi: String,
    keywords: [String],
    source: { type: String, default: 'manual' },
    externalId: String,
    pdfUrl: String,
    s3Key: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    citationCount: { type: Number, default: 0 },
    researchDomain: { type: String, default: 'Computer Science' },
    processingStatus: { type: String, default: 'completed' },
    isAnalyzed: { type: Boolean, default: false },
    analysisId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaperAnalysis' },
  },
  { timestamps: true }
);

const PaperAnalysisSchema = new mongoose.Schema(
  {
    paperId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paper', required: true, unique: true },
    summary: String,
    researchProblem: String,
    objectives: String,
    methodology: String,
    majorFindings: [String],
    limitations: [String],
    researchGaps: [String],
    futureDirections: [String],
    keywords: [String],
    importantConcepts: [String],
    relatedTopics: [String],
    researchDomain: String,
    aiProvider: String,
  },
  { timestamps: true }
);

const BookmarkSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    paperId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paper', required: true },
    notes: { type: String, default: '' },
    tags: [String],
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Paper = mongoose.models.Paper || mongoose.model('Paper', PaperSchema, 'papers');
const PaperAnalysis = mongoose.models.PaperAnalysis || mongoose.model('PaperAnalysis', PaperAnalysisSchema);
const Bookmark = mongoose.models.Bookmark || mongoose.model('Bookmark', BookmarkSchema);

const connectDB = async () => {
  let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/research-platform';
  if (uri.includes('<cluster>') || uri.includes('<username>')) {
    uri = 'mongodb://localhost:27017/research-platform';
  }
  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${uri}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const runSeed = async () => {
  await connectDB();

  console.log('Seeding initial demonstration data...');

  // 1. Create or retrieve Demo User
  // Password is bcrypt hash for 'password123'

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  let demoUser = await User.findOne({ email: 'demo@university.edu' });
  if (!demoUser) {
    demoUser = await User.create({
      name: 'Dr. Alex Morgan',
      email: 'demo@university.edu',
      passwordHash,
      institution: 'Stanford University - Cloud Lab',
      researchInterests: ['Cloud Computing', 'Microservices', 'Distributed Systems', 'Artificial Intelligence'],
    });
    console.log(`Demo user created: ${demoUser.email} (Password: password123)`);
  } else {
    demoUser.passwordHash = passwordHash;
    await demoUser.save();
    console.log(`Demo user updated: ${demoUser.email}`);
  }

  // 2. Seed realistic research papers with analyses
  const samplePapers = [
    {
      title: 'Resilient Microservice Architectures in Cloud-Native Environments',
      authors: [
        { name: 'Elena Rostova', affiliation: 'MIT Distributed Systems Group' },
        { name: 'David Chen', affiliation: 'UC Berkeley AMPLab' },
      ],
      abstract:
        'Cloud-native architectures increasingly rely on decentralized microservices communicate via REST, gRPC, and asynchronous event streams. This paper evaluates fault tolerance, circuit breakers, and service mesh sidecars under adversarial packet loss and network partitioning. We demonstrate a 42% latency improvement using distributed rate-limiting and dynamic retry exponential backoff strategies.',
      publicationYear: 2025,
      journal: 'IEEE Transactions on Cloud Computing',
      doi: '10.1109/TCC.2025.1049281',
      keywords: ['Cloud Computing', 'Microservices', 'Resilience', 'Service Mesh', 'API Gateway'],
      researchDomain: 'Cloud Computing',
      source: 'upload',
      citationCount: 48,
      analysis: {
        summary:
          'This research explores resilient patterns for microservice-based applications deployed in heterogeneous Kubernetes clusters. The authors design and benchmark an adaptive circuit-breaker mechanism integrated with envoy-based sidecar proxies, validating responsiveness during network splits.',
        researchProblem: 'Cascading service failures and latency amplification in high-throughput microservice fabrics.',
        objectives:
          'Establish quantifiable metrics for inter-service dependency resilience and design an automated retry backoff algorithm.',
        methodology:
          'Chaos engineering experimentation on a 50-node Kubernetes cluster with synthetic multi-tier microservice traffic loads simulating up to 100,000 requests per second.',
        algorithms: [
          'Dynamic Exponential Backoff with Jitter',
          'Token Bucket Distributed Rate Limiting',
          'Consensus-driven Health Probing'
        ],
        technologies: [
          'Kubernetes',
          'Envoy Proxy / Istio Service Mesh',
          'Docker',
          'Prometheus Telemetry',
          'gRPC / HTTP/2'
        ],
        datasets: [
          'Synthetic DeathStarBench Microservice Trace',
          'Simulated 50-node multi-AZ packet loss dataset'
        ],
        experimentalResults: [
          '42% reduction in P99 tail latency under 15% random packet loss.',
          '78% decrease in cascading partition failures.',
          '35% reduction in proxy sidecar memory overhead.'
        ],
        majorFindings: [
          'Adaptive circuit breakers reduce cascading cascade failures by 78%.',
          'Service mesh sidecar memory footprints can be optimized by 35% through selective route introspection.',
          'Consolidated API gateway routing mitigates cross-zone TLS overhead significantly.',
        ],
        limitations: [
          'Tested primarily on Linux x86 container runtimes; ARM64 multi-architecture overhead was not fully benchmarked.',
          'Requires centralized distributed tracing collector availability.',
        ],
        conclusion:
          'Decoupled proxy sidecars combined with dynamic jittered retries prevent catastrophic cascading outages in large-scale Kubernetes deployments with minimal operational overhead.',
        researchGaps: [
          'Autonomous recovery models driven by real-time telemetry remain nascent in production environments.',
        ],
        researchGapsDetailed: {
          unresolvedProblems: [
            'Zero-touch dynamic reconfiguration of sidecar proxies during massive split-brain events without restarting pods.'
          ],
          existingApproachLimitations: [
            'Static circuit-breaker thresholds fail under non-stationary traffic burst distributions.',
            'Centralized control planes introduce synchronization bottlenecks across multi-region clusters.'
          ],
          researchOpportunities: [
            'In-kernel eBPF packet acceleration for service-mesh traffic filtering.',
            'Decentralized peer-to-peer circuit state gossiping among edge nodes.'
          ]
        },
        futureDirections: [
          'Integrating reinforcement learning models directly into API gateway egress filters for predictive traffic shedding.',
        ],
        references: [
          {
            title: 'Cloud-native architecture and its patterns: A systematic literature review',
            authors: 'N. Kratzke, P. Quint',
            year: 2017,
            doi: '10.1016/j.sysarc.2017.07.003',
            raw: '[1] N. Kratzke and P. Quint, "Cloud-native architecture and its patterns: A systematic literature review," Journal of Systems Architecture, vol. 79, pp. 1-18, 2017.'
          },
          {
            title: 'De-architecting: A pattern-based approach to competitive engineering',
            authors: 'P. Di Francesco, I. Malavolta, P. Lago',
            year: 2019,
            doi: '10.1016/j.jss.2019.01.061',
            raw: '[2] P. Di Francesco et al., "De-architecting: A pattern-based approach to competitive engineering," Journal of Systems and Software, 2019.'
          }
        ],
        keywords: ['Cloud Computing', 'Fault Tolerance', 'Microservices', 'Kubernetes'],
        importantConcepts: ['Circuit Breaker Pattern', 'Service Mesh', 'Exponential Backoff'],
        relatedTopics: ['Distributed Systems', 'Chaos Engineering', 'Observability'],
        researchDomain: 'Cloud Computing',
        aiProvider: 'verified-seed',
        isConfigured: true,
      },
    },
    {
      title: 'Decentralized Retrieval-Augmented Generation for Scientific Research Discovery',
      authors: [
        { name: 'Marcus Sterling', affiliation: 'Oxford Robotics and AI Institute' },
        { name: 'Amina Al-Mansoor', affiliation: 'Cambridge AI Research' },
      ],
      abstract:
        'Scientific literature discovery suffers from keyword mismatch and hallucination in broad language models. We propose SciRAG, an architecture that couples domain-specific vector embeddings with fast PDF text extraction and citation graphs to generate accurate, traceable research syntheses.',
      publicationYear: 2025,
      journal: 'ACM Computing Surveys',
      doi: '10.1145/3692810.3701290',
      keywords: ['Artificial Intelligence', 'RAG', 'PyMuPDF', 'Natural Language Processing', 'Research Discovery'],
      researchDomain: 'Artificial Intelligence',
      source: 'upload',
      citationCount: 65,
      analysis: {
        summary:
          'SciRAG provides a modular cloud-native framework for automated document indexing, semantic chunking, and verifiable question-answering over academic repositories like OpenAlex and arXiv.',
        researchProblem: 'Hallucination and lack of verifiable citation attribution in large language model summaries.',
        objectives:
          'Construct an end-to-end scientific literature parsing pipeline with sub-second retrieval accuracy and exact source citation anchoring.',
        methodology:
          'FastAPI microservices processing multi-column PDFs with PyMuPDF text stream extraction followed by dense vector embedding generation and hybrid BM25 + dense re-ranking.',
        algorithms: [
          'Hybrid BM25 and Vector Similarity Fusion (RRF)',
          'Hierarchical Section Chunking with Overlap',
          'Exact Citation Span Alignment'
        ],
        technologies: [
          'PyMuPDF (fitz)',
          'FastAPI / Python 3.10',
          'ChromaDB / Vector Indices',
          'OpenAlex Scholarly Graph API',
          'Docker Containers'
        ],
        datasets: [
          'arXiv CS & AI Corpus (50,000 papers)',
          'CORD-19 Benchmark Question-Answering Evaluation Set'
        ],
        experimentalResults: [
          'Sub-second query retrieval (average 420ms latency).',
          '89% improvement in table and equation retention over baseline OCR.',
          '94.2% factual attribution verification accuracy on academic benchmarks.'
        ],
        majorFindings: [
          'Hierarchical PDF text parsing preserves figure and table captions 89% more accurately than standard OCR.',
          'Fact verification scoring improved source attribution confidence to 94.2%.',
          'Asynchronous background worker queues reduce user-perceived analysis latency to under 3 seconds.',
        ],
        limitations: [
          'High memory consumption during simultaneous batch vectorization of 100+ page monograph documents.',
        ],
        conclusion:
          'Coupling C-native PDF text extractors with hybrid sparse-dense retrieval minimizes hallucination and provides verifiable citation trails for academic research discovery platforms.',
        researchGaps: [
          'Cross-lingual scientific literature synthesis remains challenging without fine-tuned multilingual sentence transformers.',
        ],
        researchGapsDetailed: {
          unresolvedProblems: [
            'Preserving mathematical formula semantics and LaTeX equations during text stream extraction from arbitrary PDF font encodings.'
          ],
          existingApproachLimitations: [
            'Standard OCR tools consume excessive CPU and hallucinate character symbols in multi-column research formats.',
            'Fixed-size text chunking fractures continuous scientific methodologies across arbitrary boundary cuts.'
          ],
          researchOpportunities: [
            'Multi-modal layout transformers that parse scientific charts and inline raster figures simultaneously.',
            'Decentralized IPFS storage for immutable scholarly document indexing.'
          ]
        },
        futureDirections: [
          'Real-time streaming token generation via WebSockets directly to browser research dashboards.',
        ],
        references: [
          {
            title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
            authors: 'P. Lewis, E. Perez, et al.',
            year: 2020,
            doi: '10.48550/arXiv.2005.11401',
            raw: '[1] P. Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks," NeurIPS 2020.'
          }
        ],
        keywords: ['Artificial Intelligence', 'RAG', 'FastAPI', 'PyMuPDF', 'Information Retrieval'],
        importantConcepts: ['Dense Retrieval', 'Citation Verification', 'Vector Embeddings'],
        relatedTopics: ['Large Language Models', 'Knowledge Graphs', 'Semantic Search'],
        researchDomain: 'Artificial Intelligence',
        aiProvider: 'verified-seed',
        isConfigured: true,
      },
    },
    {
      title: 'Zero-Trust Security Frameworks for Distributed API Gateways and Containers',
      authors: [
        { name: 'Sarah Jenkins', affiliation: 'Carnegie Mellon CyLab' },
        { name: 'Kenji Sato', affiliation: 'Tokyo Institute of Technology' },
      ],
      abstract:
        'Modern microservices deployed across hybrid clouds challenge perimeter-based defense. This paper details a comprehensive zero-trust model combining JWT identity tokens, mutual TLS, and rate-limiting proxies at the edge. Empirical evaluation demonstrates minimal CPU overhead under strict cryptographic enforcement.',
      publicationYear: 2024,
      journal: 'Journal of Network and Computer Applications',
      doi: '10.1016/j.jnca.2024.108742',
      keywords: ['Cybersecurity', 'Zero Trust', 'API Gateway', 'JWT', 'Container Security'],
      researchDomain: 'Cybersecurity',
      source: 'upload',
      citationCount: 39,
      analysis: {
        summary:
          'The paper specifies identity-driven access controls in cloud-native microservice clusters, enforcing fine-grained RBAC and stateless token validation at the API Gateway layer.',
        researchProblem: 'Vulnerabilities associated with perimeter-only security models in microservices topologies.',
        objectives:
          'Quantify cryptographic verification latency in edge API Gateways and evaluate memory safety in container isolation.',
        methodology:
          'Synthetic penetration testing and stress evaluation against Node.js Express API Gateways utilizing helmet, rate limits, and short-lived JWT tokens.',
        algorithms: [
          'HMAC-SHA256 Stateless Signature Validation',
          'Sliding Window Request Counter for Rate Limiting',
          'Role-Based Policy Matrix Traversal'
        ],
        technologies: [
          'Express.js API Gateway',
          'Helmet.js Security Headers',
          'JSON Web Tokens (JWT)',
          'BCrypt Password Hashing',
          'TLS 1.3'
        ],
        datasets: [
          'OWASP Benchmark Test Suite v1.2',
          'Synthetic DDoS stress dataset (10,000 concurrent client simulations)'
        ],
        experimentalResults: [
          'Zero unauthorized bypasses across 50,000 simulated privilege escalation attacks.',
          '68% reduction in authorization verification latency via cryptographic token validation caching.',
          'Sub-2ms average edge gateway routing overhead under sustained load.'
        ],
        majorFindings: [
          'Token signature caching on proxy gateways reduces authentication verification overhead by 68%.',
          'Rate limiting effectively neutralizes layer-7 volumetric denial-of-service attempts.',
        ],
        limitations: [
          'Token revocation in stateless environments requires distributed blacklist lookups.',
        ],
        conclusion:
          'Stateless cryptographic tokens paired with edge gateway rate-limiting establish an impenetrable zero-trust baseline for containerized microservice architectures with negligible performance impact.',
        researchGaps: [
          'Automated anomaly detection in API payload structures without signature maintenance.',
        ],
        researchGapsDetailed: {
          unresolvedProblems: [
            'Immediate stateless token revocation without querying a centralized distributed state store.'
          ],
          existingApproachLimitations: [
            'Static IP whitelisting is ineffective in dynamic container orchestrators where pod IP addresses churn constantly.',
            'Session replication across microservices degrades horizontal cluster scalability.'
          ],
          researchOpportunities: [
            'Zero-knowledge proof verification at the API Gateway boundary.',
            'Continuous mutual TLS identity rotation backed by hardware security modules (HSM).'
          ]
        },
        futureDirections: [
          'Hardware-accelerated cryptographic token verification for ultra-low latency financial transactions.',
        ],
        references: [
          {
            title: 'Zero Trust Architecture',
            authors: 'S. Rose, O. Borchert, et al.',
            year: 2020,
            doi: '10.6028/NIST.SP.800-207',
            raw: '[1] S. Rose et al., "Zero Trust Architecture," NIST Special Publication 800-207, 2020.'
          }
        ],
        keywords: ['Cybersecurity', 'API Gateway', 'JWT', 'Zero Trust'],
        importantConcepts: ['Stateless Authentication', 'Rate Limiting', 'Defense-in-Depth'],
        relatedTopics: ['Network Security', 'Identity Management', 'Edge Computing'],
        researchDomain: 'Cybersecurity',
        aiProvider: 'verified-seed',
        isConfigured: true,
      },
    },
  ];

  for (const p of samplePapers) {
    let paper = await Paper.findOne({ title: p.title });
    if (!paper) {
      paper = await Paper.create({
        title: p.title,
        authors: p.authors,
        abstract: p.abstract,
        publicationYear: p.publicationYear,
        journal: p.journal,
        doi: p.doi,
        keywords: p.keywords,
        researchDomain: p.researchDomain,
        source: p.source,
        citationCount: p.citationCount,
        uploadedBy: demoUser._id,
        processingStatus: 'completed',
        isAnalyzed: true,
      });
      console.log(`Created paper: "${paper.title}"`);
    }

    // Upsert analysis
    let analysis = await PaperAnalysis.findOne({ paperId: paper._id });
    if (!analysis) {
      analysis = await PaperAnalysis.create({
        ...p.analysis,
        paperId: paper._id,
      });
      paper.analysisId = analysis._id;
      paper.isAnalyzed = true;
      await paper.save();
      console.log(`Linked AI analysis for: "${paper.title}"`);
    } else {
      Object.assign(analysis, p.analysis);
      await analysis.save();
      console.log(`Updated AI analysis for: "${paper.title}"`);
    }

    // Bookmark the first two papers for the demo user
    if (p.title.includes('Microservice') || p.title.includes('Retrieval-Augmented')) {
      const existingBookmark = await Bookmark.findOne({ userId: demoUser._id, paperId: paper._id });
      if (!existingBookmark) {
        await Bookmark.create({
          userId: demoUser._id,
          paperId: paper._id,
          notes: 'Key reference paper for CNAD course demonstration.',
          tags: ['demonstration', 'core-architecture'],
        });
        console.log(`Bookmarked paper: "${paper.title}"`);
      }
    }
  }

  console.log('Database seeding completed successfully!');
  process.exit(0);
};

runSeed();
