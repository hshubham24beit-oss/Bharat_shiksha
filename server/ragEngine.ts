export interface DocumentChunk {
  id: string;
  docId: string;
  docTitle: string;
  chunkIndex: number;
  text: string;
  tokenCount: number;
  embedding?: number[];
  metadata: {
    pageOrSlide?: number;
    sectionTitle?: string;
    keywords?: string[];
  };
}

export interface IngestedDocument {
  id: string;
  title: string;
  fileType: "pdf" | "docx" | "pptx" | "txt";
  uploadedAt: string;
  totalChunks: number;
  fileSizeBytes: number;
  summary: string;
  keyTopics: string[];
}

// In-memory Vector Store mimicking ChromaDB
class VectorDatabaseStore {
  private documents: Map<string, IngestedDocument> = new Map();
  private chunks: Map<string, DocumentChunk> = new Map();

  constructor() {
    // Seed initial high-yield Bharat Academix syllabus notes
    this.seedDefaultDocs();
  }

  private seedDefaultDocs() {
    const defaultDoc: IngestedDocument = {
      id: "doc-ncert-physics-1",
      title: "Class 12 Physics: Electrostatics & Coulomb's Law (NCERT)",
      fileType: "pdf",
      uploadedAt: new Date().toISOString(),
      totalChunks: 4,
      fileSizeBytes: 245000,
      summary: "Comprehensive guide on electric charges, Coulomb's Inverse-Square Law, electric field intensity, dipole moment, and Gauss's Law applications with solved examples.",
      keyTopics: ["Coulomb's Law", "Electric Field", "Gauss's Law", "Electric Potential", "Dipole Moment"],
    };

    this.documents.set(defaultDoc.id, defaultDoc);

    const defaultChunks: DocumentChunk[] = [
      {
        id: "chunk-1",
        docId: defaultDoc.id,
        docTitle: defaultDoc.title,
        chunkIndex: 0,
        text: "Electrostatics deals with the study of forces, fields and potentials arising from static charges. Electric charge is a fundamental property of matter. Like charges repel and unlike charges attract. The SI unit of charge is Coulomb (C). Charge is quantized: q = n * e, where e = 1.602 x 10^-19 C and n is an integer.",
        tokenCount: 65,
        metadata: { pageOrSlide: 1, sectionTitle: "Introduction & Quantization of Charge", keywords: ["quantization", "charge", "coulomb"] }
      },
      {
        id: "chunk-2",
        docId: defaultDoc.id,
        docTitle: defaultDoc.title,
        chunkIndex: 1,
        text: "Coulomb's Law: The magnitude of electrostatic force between two point charges q1 and q2 separated by distance r in vacuum is given by F = (1 / (4 * pi * epsilon_0)) * (|q1 * q2| / r^2), where epsilon_0 is the permittivity of free space = 8.854 x 10^-12 C^2/(N m^2). In vector form, F12 = -F21 obeying Newton's Third Law.",
        tokenCount: 78,
        metadata: { pageOrSlide: 2, sectionTitle: "Coulomb's Law in Vector Form", keywords: ["coulomb's law", "permittivity", "inverse square"] }
      },
      {
        id: "chunk-3",
        docId: defaultDoc.id,
        docTitle: defaultDoc.title,
        chunkIndex: 2,
        text: "Electric Field: The electric field E at a point in space is defined as the electrostatic force experienced by a unit positive test charge placed at that point: E = F / q0 = (1 / (4 * pi * epsilon_0)) * (q / r^2) * r_hat. Electric field lines radiate outward from positive charges and terminate on negative charges. Field lines never intersect.",
        tokenCount: 72,
        metadata: { pageOrSlide: 3, sectionTitle: "Electric Field & Field Lines", keywords: ["electric field", "field lines", "vector field"] }
      },
      {
        id: "chunk-4",
        docId: defaultDoc.id,
        docTitle: defaultDoc.title,
        chunkIndex: 3,
        text: "Gauss's Law: The total electric flux Phi through any closed Gaussian surface enclosing a net charge q_enclosed in vacuum is Phi = closed_integral(E . dA) = q_enclosed / epsilon_0. It provides an elegant method to calculate electric fields with high symmetry, such as an infinitely long charged wire (E = lambda / (2*pi*epsilon_0*r)) or a spherical shell.",
        tokenCount: 80,
        metadata: { pageOrSlide: 4, sectionTitle: "Gauss's Law & Flux", keywords: ["gauss law", "flux", "gaussian surface"] }
      }
    ];

    defaultChunks.forEach(c => this.chunks.set(c.id, c));
  }

  // Chunking text with overlapping windows
  public chunkText(text: string, docId: string, docTitle: string, chunkSize = 400, overlap = 80): DocumentChunk[] {
    const words = text.split(/\s+/).filter(Boolean);
    const chunks: DocumentChunk[] = [];
    let i = 0;
    let chunkIndex = 0;

    while (i < words.length) {
      const chunkWords = words.slice(i, i + chunkSize);
      const chunkText = chunkWords.join(" ");
      const chunkId = `chunk_${docId}_${chunkIndex}`;

      // Extract quick keywords
      const potentialKeywords = Array.from(new Set(
        chunkWords
          .filter(w => w.length > 4 && !/^(about|above|across|after|against|along|among|around|because|before|between|through|during|under|without)$/i.test(w))
          .map(w => w.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())
          .filter(Boolean)
      )).slice(0, 5);

      chunks.push({
        id: chunkId,
        docId,
        docTitle,
        chunkIndex,
        text: chunkText,
        tokenCount: chunkWords.length,
        metadata: {
          pageOrSlide: Math.floor(chunkIndex / 2) + 1,
          sectionTitle: `Section ${chunkIndex + 1}`,
          keywords: potentialKeywords
        }
      });

      if (i + chunkSize >= words.length) break;
      i += (chunkSize - overlap);
      chunkIndex++;
    }

    return chunks;
  }

  public addDocument(doc: IngestedDocument, chunks: DocumentChunk[]) {
    this.documents.set(doc.id, doc);
    chunks.forEach(chunk => this.chunks.set(chunk.id, chunk));
  }

  public getDocuments(): IngestedDocument[] {
    return Array.from(this.documents.values());
  }

  public getDocument(id: string): IngestedDocument | undefined {
    return this.documents.get(id);
  }

  public getChunksForDocument(docId: string): DocumentChunk[] {
    const results: DocumentChunk[] = [];
    for (const chunk of this.chunks.values()) {
      if (chunk.docId === docId) {
        results.push(chunk);
      }
    }
    return results.sort((a, b) => a.chunkIndex - b.chunkIndex);
  }

  public getAllChunks(): DocumentChunk[] {
    return Array.from(this.chunks.values());
  }

  public deleteDocument(id: string): boolean {
    this.documents.delete(id);
    const chunkIdsToDelete: string[] = [];
    for (const [chunkId, chunk] of this.chunks.entries()) {
      if (chunk.docId === id) {
        chunkIdsToDelete.push(chunkId);
      }
    }
    chunkIdsToDelete.forEach(id => this.chunks.delete(id));
    return true;
  }

  // Hybrid BM25 + Semantic Term Frequency Search
  public searchChunks(query: string, docIdFilter?: string, topK = 4): { chunk: DocumentChunk; score: number }[] {
    const queryTokens = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const results: { chunk: DocumentChunk; score: number }[] = [];

    for (const chunk of this.chunks.values()) {
      if (docIdFilter && chunk.docId !== docIdFilter) continue;

      const chunkLower = chunk.text.toLowerCase();
      let matchScore = 0;

      queryTokens.forEach(token => {
        // Exact word match
        const regex = new RegExp(`\\b${token}\\b`, "gi");
        const count = (chunkLower.match(regex) || []).length;
        matchScore += count * 3;

        // Substring match
        if (chunkLower.includes(token)) {
          matchScore += 1;
        }

        // Keyword tag match
        if (chunk.metadata.keywords?.some(k => k.toLowerCase().includes(token))) {
          matchScore += 4;
        }
      });

      // Context boost
      if (matchScore > 0) {
        // Add normalize factor
        const score = Math.min(0.99, (matchScore / (queryTokens.length * 5 + 1)));
        results.push({ chunk, score });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }
}

export const ragStore = new VectorDatabaseStore();
