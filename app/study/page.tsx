"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
};

type QuizData = {
  title: string;
  questions: QuizQuestion[];
};

export default function StudyPage() {
  const router = useRouter();

  const { user, loading, logout } = useAuth();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isDragging, setIsDragging] = useState(false);

  const [error, setError] = useState("");

  const [questionCount, setQuestionCount] = useState(10);

  const [difficulty, setDifficulty] = useState("Balanced");

  const [isProcessing, setIsProcessing] = useState(false);

  const [loadingStage, setLoadingStage] = useState(0);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const loadingStages = [
    {
      title: "Reading your notes",
      description: "Taking in your study material...",
    },
    {
      title: "Understanding your material",
      description: "Connecting the important ideas...",
    },
    {
      title: "Creating your quiz",
      description: "Turning your notes into questions...",
    },
  ];

  useEffect(() => {
    if (!loading && !user && !isLoggingOut) {
      router.replace("/login");
    }
  }, [loading, user, isLoggingOut, router]);

  useEffect(() => {
    if (!isProcessing) {
      setLoadingStage(0);
      return;
    }

    const firstStage = window.setTimeout(() => {
      setLoadingStage(1);
    }, 1800);

    const secondStage = window.setTimeout(() => {
      setLoadingStage(2);
    }, 4200);

    return () => {
      window.clearTimeout(firstStage);
      window.clearTimeout(secondStage);
    };
  }, [isProcessing]);

  const handleFile = (file: File) => {
    const isValidType =
      allowedTypes.includes(file.type) ||
      file.name.toLowerCase().endsWith(".pdf") ||
      file.name.toLowerCase().endsWith(".docx");

    if (!isValidType) {
      setSelectedFile(null);
      setError("Please upload a PDF or DOCX file.");
      return;
    }

    setSelectedFile(file);
    setError("");
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    const file = event.dataTransfer.files[0];

    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError("");
    setQuestionCount(10);
    setDifficulty("Balanced");
    setIsProcessing(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerateQuiz = async () => {
    if (!selectedFile || isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      setLoadingStage(0);
      setError("");

      const formData = new FormData();

      formData.append("file", selectedFile);

      formData.append("questionCount", String(questionCount));

      formData.append("difficulty", difficulty);

      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "StudyMate could not create your quiz.");
      }

      if (
        !data.quiz ||
        !Array.isArray(data.quiz.questions) ||
        data.quiz.questions.length === 0
      ) {
        throw new Error(
          "StudyMate could not create quiz questions from these notes.",
        );
      }

      const quizData: QuizData = data.quiz;

      /*
       * Every newly generated quiz gets its
       * own unique attempt ID.
       *
       * We keep this ID through the quiz and
       * results flow so Firestore can save
       * this attempt only once.
       */
      const quizId = crypto.randomUUID();

      sessionStorage.setItem("studymateQuiz", JSON.stringify(quizData));

      sessionStorage.setItem(
        "studymateQuizSettings",
        JSON.stringify({
          quizId,
          difficulty,
          requestedQuestionCount: questionCount,
          generatedQuestionCount: quizData.questions.length,
          fileName: selectedFile.name,
        }),
      );

      router.push("/quiz");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "StudyMate could not create your quiz.";

      setError(message);
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      sessionStorage.removeItem("studymateQuiz");

      sessionStorage.removeItem("studymateQuizSettings");

      sessionStorage.removeItem("studymateAnswers");

      sessionStorage.removeItem("studymateScore");

      await logout();

      window.location.href = "/";
    } catch (error) {
      console.error("StudyMate logout error:", error);

      setError("We couldn't log you out right now. Please try again.");

      setIsLoggingOut(false);
    }
  };

  const difficultyOptions = [
    {
      name: "Easy",
      description: "Straightforward questions to build confidence.",
    },
    {
      name: "Balanced",
      description: "A mix of straightforward and deeper questions.",
    },
    {
      name: "Challenging",
      description: "More demanding questions to test your understanding.",
    },
  ];

  const currentLoadingStage = loadingStages[loadingStage];

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FDF8F3] px-6 text-[#1F2140]">
        <div className="text-center">
          <div className="studymate-loader mx-auto">
            <div className="studymate-loader-ring" />

            <div className="studymate-loader-core">✦</div>
          </div>

          <p className="mt-6 text-sm font-semibold text-[#7C3AED]">
            Opening your study space...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FDF8F3] px-6 text-[#1F2140]">
        <div className="text-center">
          <div className="studymate-loader mx-auto">
            <div className="studymate-loader-ring" />

            <div className="studymate-loader-core">✦</div>
          </div>

          <p className="mt-6 text-sm font-semibold text-[#7C3AED]">
            {isLoggingOut ? "Logging you out..." : "Taking you to login..."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDF8F3] text-[#1F2140]">
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17152B]/25 px-6 backdrop-blur-md">
          <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/70 bg-white/95 px-8 py-10 text-center shadow-[0_30px_100px_rgba(42,31,67,0.22)]">
            <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-[#EADDFC] blur-3xl" />

            <div className="pointer-events-none absolute -bottom-16 -left-14 h-40 w-40 rounded-full bg-[#F3EAFD] blur-3xl" />

            <div className="relative">
              <div className="studymate-loader mx-auto">
                <div className="studymate-loader-ring" />

                <div className="studymate-loader-core">✦</div>
              </div>

              <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-[#8B5CF6]">
                StudyMate AI
              </p>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#1F2140]">
                {currentLoadingStage.title}
                <span className="loading-dots" />
              </h2>

              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-[#777184]">
                {currentLoadingStage.description}
              </p>

              <div className="mx-auto mt-7 flex max-w-[190px] items-center justify-center gap-2">
                {loadingStages.map((stage, index) => (
                  <div
                    key={stage.title}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      index === loadingStage
                        ? "w-10 bg-[#7C3AED]"
                        : index < loadingStage
                          ? "w-5 bg-[#C4A5F2]"
                          : "w-5 bg-[#E9E2EE]"
                    }`}
                  />
                ))}
              </div>

              <p className="mt-7 text-xs text-[#9A94A3]">
                Larger notes may need a little more time.
              </p>
            </div>
          </div>
        </div>
      )}

      <nav className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a
            href="/study"
            className="flex shrink-0 items-center gap-2 sm:gap-3"
          >
            <img
              src="/studyMate-logo.png"
              alt="StudyMate logo"
              className="h-14 w-14 shrink-0 object-contain min-[400px]:h-16 min-[400px]:w-16 sm:h-20 sm:w-20"
            />

            <span className="text-lg font-bold tracking-tight sm:text-xl">
              Study
              <span className="text-[#7C3AED]">Mate</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-7 lg:flex">
            <a
              href="/study"
              className="font-semibold text-[#7C3AED] transition hover:text-[#5B21B6]"
            >
              Study
            </a>

            <a
              href="/dashboard"
              className="font-medium text-[#655C70] transition hover:text-[#7C3AED]"
            >
              Dashboard
            </a>

            <a
              href="/history"
              className="font-medium text-[#655C70] transition hover:text-[#7C3AED]"
            >
              History
            </a>

            <a
              href="/profile"
              className="font-medium text-[#655C70] transition hover:text-[#7C3AED]"
            >
              Profile
            </a>
          </div>

          {/* Desktop User Area */}
          <div className="hidden items-center lg:flex">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDE3FA] text-sm font-bold uppercase text-[#6D28D9]">
                {user.displayName
                  ? user.displayName.charAt(0)
                  : user.email?.charAt(0) || "S"}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-[#918B9B]">
                  Studying as
                </p>

                <p className="max-w-[150px] truncate text-sm font-bold text-[#3E3748] xl:max-w-[190px]">
                  {user.displayName || user.email}
                </p>
              </div>
            </div>

            <div className="mx-5 h-8 w-px bg-[#DDD3E5]" />

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="shrink-0 rounded-full border border-[#D9CEE4] bg-white px-5 py-2.5 text-sm font-semibold text-[#655C70] transition hover:border-[#BDA5D9] hover:bg-[#FBF8FD] hover:text-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? "Logging out..." : "Log Out"}
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#DED3E7] bg-white text-[#4B4355] transition hover:border-[#BDA5D9] hover:text-[#7C3AED] lg:hidden"
            aria-label={
              isMobileMenuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <span className="text-2xl leading-none">×</span>
            ) : (
              <span className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-5 rounded-full bg-current" />
              </span>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute left-4 right-4 top-full z-40 mt-2 overflow-hidden rounded-3xl border border-[#E6DAF3] bg-white p-4 shadow-[0_20px_60px_rgba(68,52,91,0.16)] sm:left-6 sm:right-6 lg:hidden">
            <div className="mb-3 flex items-center gap-3 border-b border-[#EEE8F2] px-2 pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDE3FA] text-sm font-bold uppercase text-[#6D28D9]">
                {user.displayName
                  ? user.displayName.charAt(0)
                  : user.email?.charAt(0) || "S"}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-[#918B9B]">
                  Studying as
                </p>
                <p className="truncate text-sm font-bold text-[#3E3748]">
                  {user.displayName || user.email}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <a
                href="/study"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-xl bg-[#F0E7FC] px-4 py-3 font-semibold text-[#6D28D9]"
              >
                Study
              </a>

              <a
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 font-medium text-[#655C70] transition hover:bg-[#F8F3FC] hover:text-[#7C3AED]"
              >
                Dashboard
              </a>

              <a
                href="/history"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 font-medium text-[#655C70] transition hover:bg-[#F8F3FC] hover:text-[#7C3AED]"
              >
                History
              </a>

              <a
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 font-medium text-[#655C70] transition hover:bg-[#F8F3FC] hover:text-[#7C3AED]"
              >
                Profile
              </a>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="mt-3 w-full rounded-xl border border-[#E3D8EA] px-4 py-3 text-left font-semibold text-[#655C70] transition hover:bg-[#FBF8FD] hover:text-[#7C3AED] disabled:opacity-60"
            >
              {isLoggingOut ? "Logging out..." : "Log Out"}
            </button>
          </div>
        )}
      </nav>

      <section className="mx-auto max-w-4xl px-6 pb-24 pt-12">
        <div className="text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-[#F0E7FC] px-4 py-2 text-sm font-semibold text-[#6D28D9]">
            <span>✦</span>
            Let&apos;s build your quiz
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            What are we studying
            <span className="text-[#7C3AED]"> today?</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl leading-7 text-[#706C7C]">
            Upload your notes and StudyMate will turn them into a practice quiz
            based on your material.
          </p>
        </div>

        <div className="mt-12 rounded-[32px] border border-[#E6DAF3] bg-white p-5 shadow-[0_18px_60px_rgba(68,52,91,0.08)] sm:p-8">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`rounded-[26px] border-2 border-dashed px-6 py-14 text-center transition ${
              isDragging
                ? "scale-[1.01] border-[#7C3AED] bg-[#F2EAFE]"
                : "border-[#D9C8EE] bg-[#FBF8FE] hover:border-[#A78BFA] hover:bg-[#F8F2FD]"
            }`}
          >
            {!selectedFile ? (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EDE3FA] text-3xl text-[#7C3AED]">
                  ↑
                </div>

                <h2 className="mt-6 text-xl font-bold">
                  {isDragging ? "Drop it right here" : "Drop your notes here"}
                </h2>

                <p className="mt-2 text-sm text-[#817C8A]">
                  or choose a file from your device
                </p>

                <label className="mt-6 inline-block cursor-pointer rounded-full bg-[#7C3AED] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#6D28D9]">
                  Choose File
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (file) {
                        handleFile(file);
                      }
                    }}
                  />
                </label>

                <p className="mt-5 text-xs font-medium text-[#9A94A3]">
                  PDF or DOCX
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EDE3FA] text-2xl text-[#7C3AED]">
                  ✓
                </div>

                <p className="mt-5 text-sm font-semibold text-[#7C3AED]">
                  Notes ready
                </p>

                <h2 className="mx-auto mt-2 max-w-md break-words text-xl font-bold">
                  {selectedFile.name}
                </h2>

                <p className="mt-2 text-sm text-[#817C8A]">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>

                <button
                  type="button"
                  onClick={removeFile}
                  disabled={isProcessing}
                  className="mt-5 text-sm font-semibold text-[#7C3AED] transition hover:text-[#5B21B6] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Choose a different file
                </button>
              </>
            )}
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center">
              <p className="text-sm font-medium text-red-600">{error}</p>
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="mt-6 rounded-[32px] border border-[#E6DAF3] bg-white p-6 shadow-[0_18px_60px_rgba(68,52,91,0.06)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#7C3AED]">
                  QUIZ SETUP
                </p>

                <h2 className="mt-1 text-2xl font-bold text-[#1F2140]">
                  How many questions?
                </h2>

                <p className="mt-2 text-sm text-[#777184]">
                  Choose the length of your practice session.
                </p>
              </div>

              <div className="rounded-2xl bg-[#F0E7FC] px-4 py-2 text-lg font-bold text-[#7C3AED]">
                {questionCount}
              </div>
            </div>

            <div className="mt-7 grid grid-cols-3 gap-3">
              {[5, 10, 20].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setQuestionCount(amount)}
                  className={`rounded-2xl border px-4 py-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    questionCount === amount
                      ? "border-[#7C3AED] bg-[#F0E7FC] text-[#6D28D9]"
                      : "border-[#E6E0EA] bg-white text-[#686273] hover:border-[#C9B5E8]"
                  }`}
                >
                  {amount} questions
                </button>
              ))}
            </div>

            <div className="mt-9 border-t border-[#EEE8F2] pt-8">
              <h2 className="text-2xl font-bold text-[#1F2140]">
                Choose your difficulty
              </h2>

              <p className="mt-2 text-sm text-[#777184]">
                Pick how much you want your understanding to be tested.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {difficultyOptions.map((option) => (
                  <button
                    key={option.name}
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setDifficulty(option.name)}
                    className={`rounded-2xl border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      difficulty === option.name
                        ? "border-[#7C3AED] bg-[#F0E7FC]"
                        : "border-[#E6E0EA] bg-white hover:border-[#C9B5E8]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`font-bold ${
                          difficulty === option.name
                            ? "text-[#6D28D9]"
                            : "text-[#1F2140]"
                        }`}
                      >
                        {option.name}
                      </span>

                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          difficulty === option.name
                            ? "border-[#7C3AED] bg-[#7C3AED]"
                            : "border-[#CFC8D6]"
                        }`}
                      >
                        {difficulty === option.name && (
                          <span className="text-xs text-white">✓</span>
                        )}
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[#777184]">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 border-t border-[#EEE8F2] pt-8">
              <button
                type="button"
                onClick={handleGenerateQuiz}
                disabled={isProcessing}
                className={`flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-base font-semibold text-white shadow-[0_10px_30px_rgba(124,58,237,0.20)] transition ${
                  isProcessing
                    ? "cursor-not-allowed bg-[#A78BFA]"
                    : "bg-[#7C3AED] hover:-translate-y-0.5 hover:bg-[#6D28D9]"
                }`}
              >
                {isProcessing && <span className="button-spinner" />}

                {isProcessing ? currentLoadingStage.title : "Generate My Quiz"}
              </button>

              <p className="mt-3 text-center text-xs text-[#918B9B]">
                Your quiz will be created from the notes you uploaded.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-2 text-sm text-[#777184]">
            <span className="text-[#7C3AED]">✓</span>
            Your notes are used to create your study session
          </div>
        </div>
      </section>
    </main>
  );
}
