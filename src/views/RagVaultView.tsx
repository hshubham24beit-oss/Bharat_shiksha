import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  Sparkles,
  Search,
  CheckCircle2,
  Trash2,
  BookOpen,
  Layers,
  Database,
  ArrowRight,
  RefreshCw,
  Eye,
  AlertCircle,
  Paperclip,
  Check,
  Video,
  Zap,
} from "lucide-react";
import { IngestedDocument, ActiveView } from "../types";
import uploadService, {
  validateFile,
  processAndIndexDocument,
  ValidationResult,
  formatBytes,
} from "../services/uploadService";
import { apiPost } from "../services/api";

interface Props {
  documents: IngestedDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<IngestedDocument[]>>;
  selectedDocId: string | null;
  setSelectedDocId: (id: string | null) => void;
  setActiveView: (view: ActiveView) => void;
  addXp: (amount: number, reason?: string) => void;
}

export const RagVaultView: React.FC<Props> = ({
  documents,
  setDocuments,
  selectedDocId,
  setSelectedDocId,
  setActiveView,
  addXp,
}) => {
  const [titleInput, setTitleInput] = useState("");
  const [fileType, setFileType] = useState<"pdf" | "docx" | "pptx" | "txt">("pdf");
  const [textContent, setTextContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ stage: string; percent: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "search" | "documents">("upload");
  const [uploadMode, setUploadMode] = useState<"file" | "text">("file");
  const [isDragging, setIsDragging] = useState(false);
  const [generatingPack, setGeneratingPack] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Selection & Validation Handler
  const handleFileSelect = (file: File) => {
    setValidationError(null);
    const validation: ValidationResult = validateFile(file);

    if (!validation.isValid) {
      setValidationError(validation.error || "Invalid file format or size.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    if (!titleInput.trim()) {
      setTitleInput(validation.fileMeta?.cleanTitle || file.name);
    }
    setFileType(validation.fileMeta?.fileType || "pdf");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Sample quick templates for hackathon testing
  const loadSampleDoc = (type: "organic" | "neural" | "constitution") => {
    setUploadMode("text");
    setSelectedFile(null);
    setValidationError(null);
    if (type === "organic") {
      setTitleInput("NCERT Chemistry: Aldehydes, Ketones & Carboxylic Acids");
      setFileType("pdf");
      setTextContent(`Carbonyl compounds contain the carbon-oxygen double bond (>C=O). Aldehydes have carbonyl carbon bonded to hydrogen and alkyl group, while ketones are bonded to two alkyl groups.
Nucleophilic Addition Reactions: Carbonyl carbon is electrophilic (sp2 hybridized). Nucleophiles like HCN, NaHSO3, Grignard reagents attack perpendicular to the trigonal plane.
Aldol Condensation: Aldehydes and ketones having at least one alpha-hydrogen undergo reaction in presence of dilute alkali to form beta-hydroxy aldehydes (aldols).
Cannizzaro Reaction: Aldehydes with no alpha-hydrogen (like HCHO or Benzaldehyde) undergo self oxidation-reduction in 50% concentrated KOH yielding alcohol and salt of carboxylic acid.`);
    } else if (type === "neural") {
      setTitleInput("Stanford CS231n: Neural Networks & Backpropagation");
      setFileType("pdf");
      setTextContent(`Artificial Neural Networks (ANNs) consist of interconnected nodes (neurons) organized into input, hidden, and output layers.
Forward Propagation: Each layer computes Z = W*X + b, followed by an activation function A = sigma(Z) like ReLU (max(0, x)) or Softmax for classification.
Loss Function: Measures discrepancy between predicted output y_hat and true label y (e.g. Cross-Entropy Loss L = -sum(y * log(y_hat))).
Backpropagation: Computes gradient of the loss function with respect to weights using the chain rule of calculus: dL/dW = (dL/dZ) * (dZ/dW).
Gradient Descent: Weights are updated via W := W - eta * dL/dW, where eta is the learning rate hyperparameter.`);
    } else {
      setTitleInput("Indian Polity: Fundamental Rights (Articles 12-35)");
      setFileType("pdf");
      setTextContent(`Part III of the Indian Constitution guarantees Fundamental Rights to all citizens.
Right to Equality (Articles 14-18): Equality before law, prohibition of discrimination, equality of opportunity in public employment, abolition of untouchability.
Right to Freedom (Articles 19-22): Protection of 6 freedoms including speech, expression, peaceful assembly, association, movement, and residence.
Right against Exploitation (Articles 23-24): Prohibition of human trafficking, forced labour, and employment of children in hazardous industries.
Right to Constitutional Remedies (Article 32): Dr. B.R. Ambedkar described Article 32 as the 'Heart and Soul of the Constitution', granting power to move the Supreme Court via Writs (Habeas Corpus, Mandamus, Prohibition, Quo-Warranto, Certiorari).`);
    }
  };

  const handleUpload = async () => {
    setValidationError(null);

    if (uploadMode === "file") {
      if (!selectedFile) {
        setValidationError("Please select or drop a study document file to upload.");
        return;
      }
    } else {
      if (!titleInput.trim() || !textContent.trim()) {
        setValidationError("Please provide both a document title and syllabus text content.");
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress({ stage: "Initiating upload pipeline...", percent: 15 });

    try {
      let result;
      if (uploadMode === "file" && selectedFile) {
        result = await processAndIndexDocument(selectedFile, {
          customTitle: titleInput.trim() || selectedFile.name,
          onProgress: (stage, percent) => {
            const stageLabels: Record<string, string> = {
              validating: "Validating file signature & size...",
              uploading: "Uploading document to Cloudinary CDN...",
              extracting: "Extracting sections & formulas...",
              indexing: "Synthesizing vector embeddings in ChromaDB...",
              completed: "Indexing finished!",
            };
            setUploadProgress({ stage: stageLabels[stage] || stage, percent });
          },
        });
      } else {
        result = await processAndIndexDocument(
          {
            title: titleInput.trim(),
            textContent: textContent.trim(),
            fileType,
          },
          {
            onProgress: (stage, percent) => {
              setUploadProgress({ stage: "Indexing chunks in ChromaDB Vector Store...", percent });
            },
          }
        );
      }

      if (result && result.document) {
        setDocuments((prev) => [result.document, ...prev.filter((d) => d.id !== result.document.id)]);
        setSelectedDocId(result.document.id);
        setTitleInput("");
        setTextContent("");
        setSelectedFile(null);
        addXp(60, "Syllabus Notes Ingested into ChromaDB");
        setActiveTab("documents");
      }
    } catch (e: any) {
      console.error("Upload error:", e);
      setValidationError(e.message || "Failed to process and index document.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);

    try {
      const data = await uploadService.queryChromaDB(searchQuery.trim(), selectedDocId || undefined, 4);
      setSearchResults(data.chunks || []);
    } catch (e) {
      console.error("Search error:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await uploadService.deleteDocumentFromStore(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (selectedDocId === id) setSelectedDocId(null);
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  const handleGenerateStudyPack = async (docId: string) => {
    if (generatingPack) return;
    setGeneratingPack(docId);
    try {
      const result = await apiPost("/api/study-pack/generate", { docId });
      addXp(100, "Generated full study pack (Notes + Quiz + Flowchart + Video)");
      // Navigate to notes view to show results
      setSelectedDocId(docId);
      setActiveView("flashcards");
    } catch (e: any) {
      console.error("Study pack error:", e);
      alert(e.message || "Failed to generate study pack");
    } finally {
      setGeneratingPack(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-2xl card-warm space-y-6">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-deep-50 text-deep-700 text-xs font-bold border border-deep-100">
            <Database className="w-3.5 h-3.5" />
            <span>ChromaDB Vector Store & RAG Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink-900 font-display">
            Multimodal RAG Document Vault
          </h1>
          <p className="text-ink-600 text-xs sm:text-sm leading-relaxed">
            Upload your NCERT chapters, coachings notes, college PPTs, or PDF textbooks. The system automatically performs semantic chunking, vector embedding, and citation grounding for your AI Teacher.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 sm:gap-3 border-t border-ink-100 pt-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "upload"
                ? "bg-deep-600 text-white shadow-xs"
                : "bg-ink-100 text-ink-700 hover:bg-ink-200 border border-ink-200"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Material</span>
          </button>

          <button
            onClick={() => setActiveTab("documents")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "documents"
                ? "bg-deep-600 text-white shadow-xs"
                : "bg-ink-100 text-ink-700 hover:bg-ink-200 border border-ink-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Indexed Documents ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "search"
                ? "bg-deep-600 text-white shadow-xs"
                : "bg-ink-100 text-ink-700 hover:bg-ink-200 border border-ink-200"
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Vector Retrieval Sandbox</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Upload / Ingest Material */}
      {activeTab === "upload" && (
        <div className="p-6 sm:p-8 rounded-2xl card-warm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink-900">Ingest Study Documents & Syllabus</h2>
              <p className="text-xs text-ink-500">
                Upload PDFs, Word docs, PPTs, or paste syllabus text. Assets are stored via Cloudinary & indexed into ChromaDB.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="inline-flex p-1 rounded-xl bg-ink-100 border border-ink-200 text-xs font-semibold">
              <button
                onClick={() => {
                  setUploadMode("file");
                  setValidationError(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  uploadMode === "file"
                    ? "bg-white text-deep-700 shadow-xs font-bold"
                    : "text-ink-600 hover:text-ink-900"
                }`}
              >
                File Upload (.pdf, .docx, .pptx)
              </button>
              <button
                onClick={() => {
                  setUploadMode("text");
                  setValidationError(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  uploadMode === "text"
                    ? "bg-white text-deep-700 shadow-xs font-bold"
                    : "text-ink-600 hover:text-ink-900"
                }`}
              >
                Paste Syllabus Text
              </button>
            </div>
          </div>

          {/* Validation Error Alert */}
          {validationError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Validation Issue:</span>
                <span>{validationError}</span>
              </div>
              <button
                onClick={() => setValidationError(null)}
                className="text-rose-500 hover:text-rose-800 text-xs font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* File Upload Mode */}
          {uploadMode === "file" ? (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                  isDragging
                    ? "border-deep-500 bg-deep-50/50 scale-[0.99]"
                    : selectedFile
                    ? "border-deep-400 bg-deep-50/20"
                    : "border-ink-300 hover:border-deep-400 bg-ink-50/50 hover:bg-ink-50"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-deep-100 text-deep-700 flex items-center justify-center shadow-xs">
                  {selectedFile ? <FileText className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
                </div>

                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-ink-900 flex items-center justify-center gap-2">
                      <span>{selectedFile.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-deep-100 text-deep-800 uppercase font-mono">
                        {formatBytes(selectedFile.size)}
                      </span>
                    </p>
                    <p className="text-xs text-deep-600 font-medium">
                      File verified and ready for Cloudinary upload & ChromaDB indexing. Click to choose another.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-ink-800">
                      Drag & Drop your study document here, or <span className="text-deep-600 underline">browse files</span>
                    </p>
                    <p className="text-xs text-ink-500">
                      Supported: PDF, Word (.docx), PowerPoint (.pptx), Text (.txt, .md) • Max 25 MB
                    </p>
                  </div>
                )}
              </div>

              {/* Optional Custom Title Field */}
              <div>
                <label className="text-xs font-bold text-ink-700 mb-1.5 block uppercase tracking-wider">
                  Knowledge Topic Title (Optional)
                </label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="e.g. Class 12 Physics Chapter 1: Electrostatics & Coulomb's Law"
                  className="w-full px-4 py-2.5 rounded-xl bg-ink-50 border border-ink-200 text-xs sm:text-sm text-ink-900 focus:outline-none focus:border-deep-600 focus:bg-white"
                />
              </div>
            </div>
          ) : (
            /* Text Paste Mode */
            <div className="space-y-4">
              {/* Presets */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-ink-50 border border-ink-200">
                <span className="text-xs text-ink-500 font-semibold">Load High-Yield Test Snippet:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => loadSampleDoc("organic")}
                    className="px-2.5 py-1 rounded-lg bg-saffron-50 hover:bg-saffron-100 border border-saffron-100 text-xs font-semibold text-saffron-700 transition-colors cursor-pointer"
                  >
                    Chemistry (Organic)
                  </button>
                  <button
                    onClick={() => loadSampleDoc("neural")}
                    className="px-2.5 py-1 rounded-lg bg-saffron-50 hover:bg-saffron-100 border border-saffron-100 text-xs font-semibold text-saffron-700 transition-colors cursor-pointer"
                  >
                    AI / Backprop
                  </button>
                  <button
                    onClick={() => loadSampleDoc("constitution")}
                    className="px-2.5 py-1 rounded-lg bg-deep-50 hover:bg-deep-100 border border-deep-100 text-xs font-semibold text-deep-700 transition-colors cursor-pointer"
                  >
                    Polity (UPSC)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8">
                  <label className="text-xs font-bold text-ink-700 mb-1.5 block uppercase tracking-wider">Document Title</label>
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    placeholder="e.g. Class 12 Physics Chapter 1 Electrostatics"
                    className="w-full px-4 py-2.5 rounded-xl bg-ink-50 border border-ink-200 text-xs sm:text-sm text-ink-900 focus:outline-none focus:border-deep-600 focus:bg-white"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="text-xs font-bold text-ink-700 mb-1.5 block uppercase tracking-wider">Format Type</label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl bg-ink-50 border border-ink-200 text-xs sm:text-sm text-ink-900 focus:outline-none focus:border-deep-600 focus:bg-white cursor-pointer font-medium"
                  >
                    <option value="pdf">PDF Document (.pdf)</option>
                    <option value="docx">Word Document (.docx)</option>
                    <option value="pptx">Slide Deck (.pptx)</option>
                    <option value="txt">Plain Text / Notes (.txt)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-ink-700 mb-1.5 block uppercase tracking-wider">
                  Extracted Syllabus Text Content (Chunking & Embedding Source)
                </label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={6}
                  placeholder="Paste content of the chapter, lecture notes, formula derivations..."
                  className="w-full p-4 rounded-xl bg-ink-50 border border-ink-200 text-xs sm:text-sm text-ink-800 focus:outline-none focus:border-deep-600 focus:bg-white font-mono leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {uploadProgress && (
            <div className="p-4 rounded-xl bg-deep-50 border border-deep-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-deep-800">
                <span>{uploadProgress.stage}</span>
                <span>{uploadProgress.percent}%</span>
              </div>
              <div className="w-full h-2 bg-deep-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-deep-600 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={
              isUploading ||
              (uploadMode === "file" && !selectedFile) ||
              (uploadMode === "text" && (!titleInput.trim() || !textContent.trim()))
            }
            className="w-full py-3 rounded-xl bg-deep-600 hover:bg-deep-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-deep-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Indexing Document into ChromaDB Vector Store...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Process & Store in Vector Database (+60 XP)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Tab 2: Document Index List */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-ink-900">
              Active Knowledge Base ({documents.length} Files)
            </h2>
            <span className="text-xs text-ink-500 font-mono font-medium">Status: Ready for Socratic Grounding</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => {
              const isSelected = selectedDocId === doc.id;
              return (
                <div
                  key={doc.id}
                  className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-sm ${
                    isSelected
                      ? "bg-deep-50/50 border-deep-300"
                      : "card-warm"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ink-100 text-ink-600 font-mono uppercase">
                        {doc.fileType}
                      </span>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1 text-ink-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-ink-900">{doc.title}</h3>
                    <p className="text-xs text-ink-600 line-clamp-2 leading-relaxed">{doc.summary}</p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {doc.keyTopics.map((k, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-ink-100 border border-ink-200 text-[10px] font-semibold text-deep-700"
                        >
                          #{k}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-ink-100 pt-3 flex items-center justify-between">
                    <span className="text-[11px] text-ink-500 font-mono">
                      {doc.totalChunks} Chunks Indexed
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedDocId(isSelected ? null : doc.id);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-deep-600 text-white"
                            : "bg-ink-100 text-ink-700 hover:bg-ink-200"
                        }`}
                      >
                        {isSelected ? "✓ Active Grounding" : "Select for Grounding"}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedDocId(doc.id);
                          setActiveView("flashcards");
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-saffron-50 hover:bg-saffron-100 text-saffron-800 border border-saffron-200 text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        title="Open Smart Notes & Cheat Sheet for offline PDF export"
                      >
                        <FileText className="w-3.5 h-3.5 text-saffron-600" />
                        <span>Notes & PDF</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedDocId(doc.id);
                          setActiveView("video-lecture");
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-saffron-50 hover:bg-saffron-100 text-saffron-800 border border-saffron-200 text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        title="Generate and Play Synchronized AI Video Lecture on this document"
                      >
                        <Video className="w-3.5 h-3.5 text-saffron-600" />
                        <span>AI Video</span>
                      </button>

                      <button
                        onClick={() => handleGenerateStudyPack(doc.id)}
                        disabled={generatingPack === doc.id}
                        className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-saffron-500 to-deep-600 hover:from-saffron-600 hover:to-deep-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-60"
                        title="Generate complete study pack: Notes + Quiz + Flowchart + Video from this document"
                      >
                        {generatingPack === doc.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Zap className="w-3.5 h-3.5" />
                        )}
                        <span>Study Pack</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedDocId(doc.id);
                          setActiveView("teacher");
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Teach with AI Avatar</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Retrieval Sandbox */}
      {activeTab === "search" && (
        <div className="p-6 sm:p-8 rounded-2xl card-warm space-y-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-ink-900">Hybrid Vector Search Sandbox</h2>
            <p className="text-xs text-ink-500">
              Test semantic similarity matching against all indexed chunks in ChromaDB.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Enter search query e.g. 'Coulomb force in vector form' or 'Cannizzaro reaction'"
              className="flex-1 px-4 py-2.5 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-900 focus:outline-none focus:border-deep-600 focus:bg-white"
            />
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
              className="px-5 py-2.5 rounded-xl bg-deep-600 hover:bg-deep-700 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Query Vectors</span>
            </button>
          </div>

          {/* Results List */}
          {searchResults.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-deep-700">
                Top {searchResults.length} Semantic Matches Retrieved
              </h3>

              <div className="space-y-3">
                {searchResults.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-xl bg-ink-50 border border-ink-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-saffron-700">
                        {res.docTitle} • {res.sectionTitle}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-deep-100 text-deep-800 text-xs font-mono font-bold">
                        Relevance: {res.score}%
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-ink-800 leading-relaxed font-mono bg-white p-3 rounded-lg border border-ink-200">
                      "{res.text}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};