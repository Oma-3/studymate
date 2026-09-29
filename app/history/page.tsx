"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

type QuizHistoryItem = {
  id: string;
  title: string;
  fileName: string;
  difficulty: string;
  questionCount: number;
  score: number;
  percentage: number;
  createdAt: Timestamp | null;
};

export default function HistoryPage() {
  const router = useRouter();

  const { user, loading: authLoading, logout } = useAuth();

  const [quizzes, setQuizzes] = useState<QuizHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");

  useEffect(() => {
    if (!authLoading && !user && !isLoggingOut) {
      router.replace("/login");
    }
  }, [authLoading, user, isLoggingOut, router]);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const loadQuizHistory = async () => {
      try {
        setLoadingHistory(true);
        setError("");

        const quizzesReference = collection(db, "users", user.uid, "quizzes");

        const quizzesQuery = query(
          quizzesReference,
          orderBy("createdAt", "desc"),
        );

        const snapshot = await getDocs(quizzesQuery);

        const quizHistory: QuizHistoryItem[] = snapshot.docs.map((document) => {
          const data = document.data();

          return {
            id: document.id,

            title: typeof data.title === "string" ? data.title : "Study Quiz",

            fileName:
              typeof data.fileName === "string" ? data.fileName : "Study notes",

            difficulty:
              typeof data.difficulty === "string"
                ? data.difficulty
                : "Balanced",

            questionCount:
              typeof data.questionCount === "number" ? data.questionCount : 0,

            score: typeof data.score === "number" ? data.score : 0,

            percentage:
              typeof data.percentage === "number" ? data.percentage : 0,

            createdAt:
              data.createdAt instanceof Timestamp ? data.createdAt : null,
          };
        });

        setQuizzes(quizHistory);
      } catch (error) {
        console.error("StudyMate history error:", error);

        setError(
          "We couldn't load your study history right now. Please try again.",
        );
      } finally {
        setLoadingHistory(false);
      }
    };

    void loadQuizHistory();
  }, [authLoading, user]);

  const difficulties = useMemo(() => {
    const availableDifficulties = Array.from(
      new Set(quizzes.map((quiz) => quiz.difficulty)),
    );

    return ["All", ...availableDifficulties];
  }, [quizzes]);

  const filteredQuizzes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return quizzes.filter((quiz) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        quiz.title.toLowerCase().includes(normalizedSearch) ||
        quiz.fileName.toLowerCase().includes(normalizedSearch);

      const matchesDifficulty =
        difficultyFilter === "All" || quiz.difficulty === difficultyFilter;

      return matchesSearch && matchesDifficulty;
    });
  }, [quizzes, searchTerm, difficultyFilter]);

  const firstName = user?.displayName?.trim().split(/\s+/)[0] || "Student";

  const initial = firstName.charAt(0).toUpperCase() || "S";

  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) {
      return "Just now";
    }

    return timestamp.toDate().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timestamp: Timestamp | null) => {
    if (!timestamp) {
      return "";
    }

    return timestamp.toDate().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 80) {
      return "Great work";
    }

    if (percentage >= 60) {
      return "Good progress";
    }

    return "Keep practising";
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

  if (authLoading || (!user && !isLoggingOut)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FDF8F3] px-4 sm:px-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E9DDFC] text-2xl text-[#7C3AED]">
            ✦
          </div>

          <p className="mt-4 text-sm font-medium text-[#747184]">
            Opening your study history...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FDF8F3] text-[#25213D]">
      {/* Navbar */}
      <nav className="relative z-50 border-b border-[#EEE6F4] bg-[#FDF8F3]/95">
        <div className="mx-auto w-full max-w-7xl px-3 py-3 min-[400px]:px-4 sm:px-6 sm:py-4 lg:px-10 lg:py-5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button
              type="button"
              onClick={() => router.push("/study")}
              className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2"
            >
              <img
                src="/studyMate-logo.png"
                alt="StudyMate logo"
                className="h-12 w-12 shrink-0 object-contain min-[400px]:h-14 min-[400px]:w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20"
              />

              <span className="text-base font-bold tracking-tight min-[400px]:text-lg sm:text-xl">
                Study
                <span className="text-[#7C3AED]">Mate</span>
              </span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-7 lg:flex">
              <button
                type="button"
                onClick={() => router.push("/study")}
                className="font-medium text-[#655C70] transition hover:text-[#7C3AED]"
              >
                Study
              </button>

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="font-medium text-[#655C70] transition hover:text-[#7C3AED]"
              >
                Dashboard
              </button>

              <button
                type="button"
                onClick={() => router.push("/history")}
                className="font-semibold text-[#7C3AED] transition hover:text-[#5B21B6]"
              >
                History
              </button>

              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="font-medium text-[#655C70] transition hover:text-[#7C3AED]"
              >
                Profile
              </button>
            </div>

            {/* Desktop User Area */}
            <div className="hidden items-center lg:flex">
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="flex min-w-0 items-center gap-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDE3FA] text-sm font-bold uppercase text-[#6D28D9]">
                  {initial}
                </div>

                <div className="min-w-0 text-left">
                  <p className="text-xs font-medium text-[#918B9B]">
                    Studying as
                  </p>

                  <p className="max-w-[150px] truncate text-sm font-bold text-[#3E3748] xl:max-w-[190px]">
                    {user.displayName || user.email}
                  </p>
                </div>
              </button>

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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#DED3E7] bg-white text-[#4B4355] transition hover:border-[#BDA5D9] hover:text-[#7C3AED] min-[400px]:h-11 min-[400px]:w-11 lg:hidden"
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
            <div className="absolute left-3 right-3 top-full z-50 mt-2 max-h-[calc(100vh-90px)] overflow-y-auto rounded-2xl border border-[#E6DAF3] bg-white p-3 shadow-[0_20px_60px_rgba(68,52,91,0.16)] min-[400px]:left-4 min-[400px]:right-4 min-[400px]:rounded-3xl min-[400px]:p-4 sm:left-6 sm:right-6 lg:hidden">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/profile");
                }}
                className="mb-3 flex w-full min-w-0 items-center gap-3 border-b border-[#EEE8F2] px-2 pb-4 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDE3FA] text-sm font-bold uppercase text-[#6D28D9]">
                  {initial}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#918B9B]">
                    Studying as
                  </p>

                  <p className="truncate text-sm font-bold text-[#3E3748]">
                    {user.displayName || user.email}
                  </p>
                </div>
              </button>

              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push("/study");
                  }}
                  className="rounded-xl px-4 py-3 text-left font-medium text-[#655C70] transition hover:bg-[#F8F3FC] hover:text-[#7C3AED]"
                >
                  Study
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push("/dashboard");
                  }}
                  className="rounded-xl px-4 py-3 text-left font-medium text-[#655C70] transition hover:bg-[#F8F3FC] hover:text-[#7C3AED]"
                >
                  Dashboard
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push("/history");
                  }}
                  className="rounded-xl bg-[#F0E7FC] px-4 py-3 text-left font-semibold text-[#6D28D9]"
                >
                  History
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push("/profile");
                  }}
                  className="rounded-xl px-4 py-3 text-left font-medium text-[#655C70] transition hover:bg-[#F8F3FC] hover:text-[#7C3AED]"
                >
                  Profile
                </button>
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
        </div>
      </nav>

      {/* Page Content */}
      <div className="mx-auto w-full max-w-7xl px-3 py-7 min-[400px]:px-4 sm:px-6 sm:py-10 lg:px-10 lg:py-14">
        {/* Page Heading */}
        <section className="flex flex-col gap-5 sm:gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full bg-[#F0E7FC] px-3 py-2 text-[11px] font-semibold text-[#6D28D9] min-[400px]:px-4 min-[400px]:text-xs sm:mb-4 sm:text-sm">
              <span>✦</span>
              <span className="truncate">YOUR STUDY JOURNEY</span>
            </div>

            <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-[#1F2140] min-[400px]:text-3xl sm:text-4xl lg:text-5xl">
              Study History
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#706C7C] min-[400px]:text-base min-[400px]:leading-7 sm:text-lg">
              Revisit your past quizzes, answers, explanations, and progress
              whenever you need them.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/study")}
            className="w-full shrink-0 rounded-full bg-[#7C3AED] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#6D28D9] min-[400px]:px-6 min-[400px]:py-3.5 min-[400px]:text-base md:w-auto"
          >
            + New Study Session
          </button>
        </section>

        {/* Error */}
        {error && (
          <div className="mt-6 break-words rounded-2xl border border-[#F1CCCC] bg-[#FFF4F4] px-4 py-4 text-sm font-medium leading-6 text-[#A24747] sm:mt-8 sm:px-5">
            {error}
          </div>
        )}

        {/* Search / Filter */}
        {!loadingHistory && quizzes.length > 0 && (
          <section className="mt-7 rounded-[22px] border border-[#E8DDF5] bg-white p-4 shadow-[0_10px_35px_rgba(75,55,110,0.04)] min-[400px]:p-5 sm:mt-10 sm:rounded-[28px] sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#292544]">
                  Find a study session
                </p>

                <p className="mt-1 text-xs leading-5 text-[#8B8798]">
                  Search by quiz or file name, or filter by difficulty.
                </p>
              </div>

              <div className="flex w-full min-w-0 flex-col gap-3 md:flex-row lg:w-auto">
                <div className="relative w-full min-w-0 md:min-w-[280px] lg:w-[320px]">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9B91A7]">
                    ⌕
                  </span>

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search your history..."
                    className="w-full min-w-0 rounded-full border border-[#E1D7EB] bg-[#FCFAFD] py-3 pl-11 pr-4 text-sm text-[#403A54] outline-none transition placeholder:text-[#AAA4B2] focus:border-[#B99AE0] focus:ring-4 focus:ring-[#F1E8FC]"
                  />
                </div>

                <select
                  value={difficultyFilter}
                  onChange={(event) => setDifficultyFilter(event.target.value)}
                  className="w-full min-w-0 rounded-full border border-[#E1D7EB] bg-[#FCFAFD] px-5 py-3 text-sm font-semibold text-[#5E5870] outline-none transition focus:border-[#B99AE0] focus:ring-4 focus:ring-[#F1E8FC] md:w-auto"
                >
                  {difficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty === "All" ? "All difficulties" : difficulty}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        )}

        {/* Sessions */}
        <section className="mt-8 sm:mt-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7C3AED] min-[400px]:text-xs min-[400px]:tracking-[0.16em]">
                ALL SESSIONS
              </p>

              <h2 className="mt-2 text-xl font-bold leading-tight text-[#1F2140] min-[400px]:text-2xl sm:text-3xl">
                Your completed quizzes
              </h2>
            </div>

            {!loadingHistory && quizzes.length > 0 && (
              <p className="shrink-0 text-sm text-[#8B8798]">
                {filteredQuizzes.length}{" "}
                {filteredQuizzes.length === 1 ? "session" : "sessions"}
              </p>
            )}
          </div>

          {loadingHistory ? (
            <div className="mt-5 rounded-[22px] border border-[#E8E1EC] bg-white px-4 py-10 text-center min-[400px]:p-10 sm:mt-6 sm:rounded-[28px]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0E7FC] text-xl text-[#7C3AED]">
                ✦
              </div>

              <p className="mt-4 text-sm font-semibold text-[#403A54] min-[400px]:text-base">
                Loading your study history...
              </p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="mt-5 rounded-[22px] border border-dashed border-[#D8C6F3] bg-white/60 px-4 py-10 text-center min-[400px]:px-6 min-[400px]:py-12 sm:mt-6 sm:rounded-[28px] sm:py-14">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0E7FC] text-2xl text-[#7C3AED]">
                📚
              </div>

              <h3 className="mt-5 text-lg font-bold text-[#1F2140] min-[400px]:text-xl">
                No study sessions yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#747184] min-[400px]:text-base min-[400px]:leading-7">
                Complete your first quiz and your study history will begin here.
              </p>

              <button
                type="button"
                onClick={() => router.push("/study")}
                className="mt-6 w-full rounded-full bg-[#7C3AED] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#6D28D9] min-[400px]:w-auto min-[400px]:text-base"
              >
                Start Studying
              </button>
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="mt-5 rounded-[22px] border border-[#E8E1EC] bg-white px-4 py-10 text-center min-[400px]:px-6 sm:mt-6 sm:rounded-[28px] sm:py-12">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0E7FC] text-xl text-[#7C3AED]">
                ⌕
              </div>

              <h3 className="mt-5 text-lg font-bold text-[#1F2140] min-[400px]:text-xl">
                No matching sessions
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#747184] min-[400px]:text-base min-[400px]:leading-7">
                Try another search or change the difficulty filter.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setDifficultyFilter("All");
                }}
                className="mt-5 rounded-full border border-[#D8C6F3] bg-white px-5 py-2.5 text-sm font-semibold text-[#6D28D9] transition hover:bg-[#F5EFFC]"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="mt-5 grid min-w-0 gap-3 sm:mt-6 sm:gap-4">
              {filteredQuizzes.map((quiz) => (
                <button
                  key={quiz.id}
                  type="button"
                  onClick={() => router.push(`/history/${quiz.id}`)}
                  className="group w-full min-w-0 overflow-hidden rounded-[20px] border border-[#E8E1EC] bg-white p-4 text-left shadow-[0_8px_30px_rgba(75,55,110,0.04)] transition hover:-translate-y-0.5 hover:border-[#CDB5EB] hover:shadow-[0_12px_35px_rgba(75,55,110,0.08)] min-[400px]:rounded-[24px] min-[400px]:p-5 sm:rounded-[26px] sm:p-6"
                >
                  <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-5">
                    {/* Quiz Information */}
                    <div className="flex min-w-0 flex-1 items-start gap-3 min-[400px]:gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0E7FC] text-lg min-[400px]:h-12 min-[400px]:w-12 min-[400px]:rounded-2xl min-[400px]:text-xl">
                        📄
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-start gap-2">
                          <h3 className="min-w-0 flex-1 break-words text-sm font-bold leading-5 text-[#292544] min-[400px]:text-base min-[400px]:leading-6 sm:text-lg">
                            {quiz.title}
                          </h3>

                          <span className="mt-0.5 shrink-0 text-sm text-[#9A82B5] transition-transform group-hover:translate-x-1">
                            →
                          </span>
                        </div>

                        <p className="mt-1 break-all text-xs leading-5 text-[#7C7788] min-[400px]:break-words min-[400px]:text-sm">
                          {quiz.fileName}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] min-[400px]:gap-2 min-[400px]:text-xs">
                          <span className="max-w-full rounded-full bg-[#F5F1F8] px-2.5 py-1 font-medium text-[#665E73] min-[400px]:px-3">
                            {quiz.difficulty}
                          </span>

                          <span className="rounded-full bg-[#F5F1F8] px-2.5 py-1 font-medium text-[#665E73] min-[400px]:px-3">
                            {quiz.questionCount}{" "}
                            {quiz.questionCount === 1
                              ? "question"
                              : "questions"}
                          </span>

                          <span className="w-full break-words pt-0.5 text-[#9691A3] min-[480px]:w-auto min-[480px]:pt-0">
                            {formatDate(quiz.createdAt)}

                            {formatTime(quiz.createdAt) && (
                              <> · {formatTime(quiz.createdAt)}</>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex w-full min-w-0 items-center justify-between gap-3 border-t border-[#F0EAF4] pt-4 md:w-auto md:shrink-0 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                      <div className="min-w-0 md:text-right">
                        <p className="text-xl font-bold text-[#7C3AED] min-[400px]:text-2xl">
                          {Math.round(quiz.percentage)}%
                        </p>

                        <p className="mt-1 whitespace-nowrap text-[11px] font-medium text-[#8B8798] min-[400px]:text-xs">
                          {quiz.score}/{quiz.questionCount} correct
                        </p>
                      </div>

                      <div className="max-w-[145px] shrink-0 rounded-full bg-[#F0E7FC] px-2.5 py-1.5 text-center text-[10px] font-semibold leading-4 text-[#6D28D9] min-[400px]:max-w-none min-[400px]:px-3 min-[400px]:text-xs">
                        {getScoreMessage(quiz.percentage)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-[#F3EDF6] pt-3 text-[11px] font-semibold leading-5 text-[#8063A2] opacity-80 min-[400px]:text-xs md:text-right">
                    View answers and explanations →
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
