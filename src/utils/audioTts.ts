// Web Speech API Voice Synthesizer & Speech Recognition with Indian & Multilingual support

export interface SpeakOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  voiceGender?: "female" | "male";
  onStart?: () => void;
  onEnd?: () => void;
  onBoundary?: (word: string, charIndex: number) => void;
}

class VoiceSynthesizer {
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  public speak(
    text: string,
    languageOrOptions: string | SpeakOptions = "English",
    onStart?: () => void,
    onEnd?: () => void
  ) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      console.warn("Speech synthesis not supported in this browser.");
      return;
    }

    this.stop();

    const options: SpeakOptions =
      typeof languageOrOptions === "string"
        ? { language: languageOrOptions, onStart, onEnd }
        : languageOrOptions;

    const language = options.language || "English";

    // Clean text of Markdown symbols and KaTeX syntax for crisp speech
    const cleanText = text
      .replace(/```[\s\S]*?```/g, " [Code snippet shown on blackboard] ")
      .replace(/\$\$[\s\S]*?\$\$/g, " [Formula shown on blackboard] ")
      .replace(/\$+/g, "")
      .replace(/[#*_`~>-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;

    // Select suitable voice
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice: SpeechSynthesisVoice | undefined;

    const langCodeMap: Record<string, string> = {
      English: "en-IN",
      Hindi: "hi-IN",
      Hinglish: "hi-IN",
      Tamil: "ta-IN",
      Telugu: "te-IN",
      Marathi: "mr-IN",
      Bengali: "bn-IN",
      Kannada: "kn-IN",
      Gujarati: "gu-IN",
      Malayalam: "ml-IN",
      Punjabi: "pa-IN",
    };

    const targetCode = langCodeMap[language] || "en-IN";
    utterance.lang = targetCode;

    // Voice matching preference with gender heuristics if possible
    const genderTerm = options.voiceGender === "male" ? "male" : "female";
    
    // 1. Try finding Indian voice matching gender
    selectedVoice = voices.find(
      (v) =>
        (v.lang === targetCode || v.lang.startsWith(targetCode.slice(0, 2))) &&
        v.name.toLowerCase().includes(genderTerm)
    );

    // 2. Try any Indian voice for target language
    if (!selectedVoice) {
      selectedVoice = voices.find(
        (v) => v.lang === targetCode || v.lang.startsWith(targetCode.slice(0, 2))
      );
    }

    // 3. Fallback to general Indian English or Natural voice
    if (!selectedVoice) {
      selectedVoice = voices.find(
        (v) =>
          v.lang.includes("en-IN") ||
          v.name.includes("India") ||
          v.name.includes("Google") ||
          v.name.includes("Natural")
      );
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = options.rate !== undefined ? options.rate : 0.95;
    utterance.pitch = options.pitch !== undefined ? options.pitch : 1.05;

    utterance.onstart = () => {
      this.isSpeaking = true;
      options.onStart?.();
    };

    utterance.onboundary = (e: SpeechSynthesisEvent) => {
      if (options.onBoundary && e.name === "word") {
        const spokenWord = cleanText.slice(e.charIndex, e.charIndex + (e.charLength || 6));
        options.onBoundary(spokenWord, e.charIndex);
      }
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn("TTS Error:", e);
      this.isSpeaking = false;
      this.currentUtterance = null;
      options.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stop() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const ttsEngine = new VoiceSynthesizer();

