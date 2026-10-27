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
  let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/research_platform';
  if (uri.includes('<cluster>') || uri.includes('<username>')) {
    uri = 'mongodb://localhost:27017/research_platform';
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
  const bcrypt = require('bcryptjs');
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
        majorFindings: [
          'Adaptive circuit breakers reduce cascading cascade failures by 78%.',
          'Service mesh sidecar memory footprints can be optimized by 35% through selective route introspection.',
          'Consolidated API gateway routing mitigates cross-zone TLS overhead significantly.',
        ],
        limitations: [
          'Tested primarily on Linux x86 container runtimes; ARM64 multi-architecture overhead was not fully benchmarked.',
          'Requires centralized distributed tracing collector availability.',
        ],
        researchGaps: [
          'Autonomous recovery models driven by real-time telemetry remain nascent in production environments.',
        ],
        futureDirections: [
          'Integrating reinforcement learning models directly into API gateway egress filters for predictive traffic shedding.',
        ],
        keywords: ['Cloud Computing', 'Fault Tolerance', 'Microservices', 'Kubernetes'],
        importantConcepts: ['Circuit Breaker Pattern', 'Service Mesh', 'Exponential Backoff'],
        relatedTopics: ['Distributed Systems', 'Chaos Engineering', 'Observability'],
        researchDomain: 'Cloud Computing',
        aiProvider: 'verified-seed',
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
        majorFindings: [
          'Hierarchical PDF text parsing preserves figure and table captions 89% more accurately than standard OCR.',
          'Fact verification scoring improved source attribution confidence to 94.2%.',
          'Asynchronous background worker queues reduce user-perceived analysis latency to under 3 seconds.',
        ],
        limitations: [
          'High memory consumption during simultaneous batch vectorization of 100+ page monograph documents.',
        ],
        researchGaps: [
          'Cross-lingual scientific literature synthesis remains challenging without fine-tuned multilingual sentence transformers.',
        ],
        futureDirections: [
          'Real-time streaming token generation via WebSockets directly to browser research dashboards.',
        ],
        keywords: ['Artificial Intelligence', 'RAG', 'FastAPI', 'PyMuPDF', 'Information Retrieval'],
        importantConcepts: ['Dense Retrieval', 'Citation Verification', 'Vector Embeddings'],
        relatedTopics: ['Large Language Models', 'Knowledge Graphs', 'Semantic Search'],
        researchDomain: 'Artificial Intelligence',
        aiProvider: 'verified-seed',
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
        majorFindings: [
          'Token signature caching on proxy gateways reduces authentication verification overhead by 68%.',
          'Rate limiting effectively neutralizes layer-7 volumetric denial-of-service attempts.',
        ],
        limitations: [
          'Token revocation in stateless environments requires distributed blacklist lookups.',
        ],
        researchGaps: [
          'Automated anomaly detection in API payload structures without signature maintenance.',
        ],
        futureDirections: [
          'Hardware-accelerated cryptographic token verification for ultra-low latency financial transactions.',
        ],
        keywords: ['Cybersecurity', 'API Gateway', 'JWT', 'Zero Trust'],
        importantConcepts: ['Stateless Authentication', 'Rate Limiting', 'Defense-in-Depth'],
        relatedTopics: ['Network Security', 'Identity Management', 'Edge Computing'],
        researchDomain: 'Cybersecurity',
        aiProvider: 'verified-seed',
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
