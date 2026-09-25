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
      <main className="flex min-h-screen items-center justify-center bg-[#FDF8F3] px-6">
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
    <main className="min-h-screen bg-[#FDF8F3] text-[#25213D]">
      <nav className="border-b border-[#EEE6F4] bg-[#FDF8F3]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-10">
          <button
            type="button"
            onClick={() => router.push("/")}
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
          </button>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => router.push("/study")}
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-[#5E5870] transition hover:bg-[#F2EAFE] hover:text-[#7C3AED] sm:block"
            >
              Study
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-[#5E5870] transition hover:bg-[#F2EAFE] hover:text-[#7C3AED] sm:block"
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={() => router.push("/history")}
              className="hidden rounded-full bg-[#F0E7FC] px-4 py-2 text-sm font-semibold text-[#7C3AED] sm:block"
            >
              History
            </button>

            <div className="hidden h-7 w-px bg-[#DDD4E7] sm:block" />

            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="flex items-center gap-2"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7C3AED] text-sm font-bold text-white">
                {initial}
              </div>

              <span className="hidden max-w-[120px] truncate text-sm font-semibold text-[#403A54] md:block">
                {firstName}
              </span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="ml-1 rounded-full border border-[#D8C6F3] px-3 py-2 text-xs font-semibold text-[#5A4A70] transition hover:bg-[#F2EAFE] disabled:cursor-not-allowed disabled:opacity-60 sm:ml-2 sm:px-4 sm:text-sm"
            >
              {isLoggingOut ? "Leaving..." : "Log Out"}
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-10 lg:py-14">
        <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#F0E7FC] px-4 py-2 text-xs font-semibold text-[#6D28D9] sm:text-sm">
              <span>✦</span>
              YOUR STUDY JOURNEY
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[#1F2140] sm:text-4xl lg:text-5xl">
              Study History
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-[#706C7C] sm:text-lg">
              Revisit your past quizzes, answers, explanations, and progress
              whenever you need them.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/study")}
            className="w-full rounded-full bg-[#7C3AED] px-6 py-3.5 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#6D28D9] sm:w-auto"
          >
            + New Study Session
          </button>
        </section>

        {error && (
          <div className="mt-8 rounded-2xl border border-[#F1CCCC] bg-[#FFF4F4] px-5 py-4 text-sm font-medium text-[#A24747]">
            {error}
          </div>
        )}

        {!loadingHistory && quizzes.length > 0 && (
          <section className="mt-10 rounded-[28px] border border-[#E8DDF5] bg-white p-5 shadow-[0_10px_35px_rgba(75,55,110,0.04)] sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold text-[#292544]">
                  Find a study session
                </p>

                <p className="mt-1 text-xs text-[#8B8798]">
                  Search by quiz or file name, or filter by difficulty.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                <div className="relative w-full sm:min-w-[280px]">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9B91A7]">
                    ⌕
                  </span>

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search your history..."
                    className="w-full rounded-full border border-[#E1D7EB] bg-[#FCFAFD] py-3 pl-11 pr-4 text-sm text-[#403A54] outline-none transition placeholder:text-[#AAA4B2] focus:border-[#B99AE0] focus:ring-4 focus:ring-[#F1E8FC]"
                  />
                </div>

                <select
                  value={difficultyFilter}
                  onChange={(event) => setDifficultyFilter(event.target.value)}
                  className="rounded-full border border-[#E1D7EB] bg-[#FCFAFD] px-5 py-3 text-sm font-semibold text-[#5E5870] outline-none transition focus:border-[#B99AE0] focus:ring-4 focus:ring-[#F1E8FC]"
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

        <section className="mt-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7C3AED]">
                ALL SESSIONS
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#1F2140] sm:text-3xl">
                Your completed quizzes
              </h2>
            </div>

            {!loadingHistory && quizzes.length > 0 && (
              <p className="text-sm text-[#8B8798]">
                {filteredQuizzes.length}{" "}
                {filteredQuizzes.length === 1 ? "session" : "sessions"}
              </p>
            )}
          </div>

          {loadingHistory ? (
            <div className="mt-6 rounded-[28px] border border-[#E8E1EC] bg-white p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0E7FC] text-xl text-[#7C3AED]">
                ✦
              </div>

              <p className="mt-4 font-semibold text-[#403A54]">
                Loading your study history...
              </p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-dashed border-[#D8C6F3] bg-white/60 px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0E7FC] text-2xl text-[#7C3AED]">
                📚
              </div>

              <h3 className="mt-5 text-xl font-bold text-[#1F2140]">
                No study sessions yet
              </h3>

              <p className="mx-auto mt-2 max-w-md leading-7 text-[#747184]">
                Complete your first quiz and your study history will begin here.
              </p>

              <button
                type="button"
                onClick={() => router.push("/study")}
                className="mt-6 rounded-full bg-[#7C3AED] px-6 py-3 font-semibold text-white transition hover:bg-[#6D28D9]"
              >
                Start Studying
              </button>
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-[#E8E1EC] bg-white px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0E7FC] text-xl text-[#7C3AED]">
                ⌕
              </div>

              <h3 className="mt-5 text-xl font-bold text-[#1F2140]">
                No matching sessions
              </h3>

              <p className="mx-auto mt-2 max-w-md leading-7 text-[#747184]">
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
            <div className="mt-6 grid gap-4">
              {filteredQuizzes.map((quiz) => (
                <button
                  key={quiz.id}
                  type="button"
                  onClick={() => router.push(`/history/${quiz.id}`)}
                  className="group w-full rounded-[26px] border border-[#E8E1EC] bg-white p-5 text-left shadow-[0_8px_30px_rgba(75,55,110,0.04)] transition hover:-translate-y-0.5 hover:border-[#CDB5EB] hover:shadow-[0_12px_35px_rgba(75,55,110,0.08)] sm:p-6"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F0E7FC] text-xl">
                        📄
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-base font-bold text-[#292544] sm:text-lg">
                            {quiz.title}
                          </h3>

                          <span className="shrink-0 text-sm text-[#9A82B5] transition-transform group-hover:translate-x-1">
                            →
                          </span>
                        </div>

                        <p className="mt-1 truncate text-sm text-[#7C7788]">
                          {quiz.fileName}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-[#F5F1F8] px-3 py-1 font-medium text-[#665E73]">
                            {quiz.difficulty}
                          </span>

                          <span className="rounded-full bg-[#F5F1F8] px-3 py-1 font-medium text-[#665E73]">
                            {quiz.questionCount}{" "}
                            {quiz.questionCount === 1
                              ? "question"
                              : "questions"}
                          </span>

                          <span className="text-[#9691A3]">
                            {formatDate(quiz.createdAt)}

                            {formatTime(quiz.createdAt) && (
                              <> · {formatTime(quiz.createdAt)}</>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-5 border-t border-[#F0EAF4] pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                      <div className="sm:text-right">
                        <p className="text-2xl font-bold text-[#7C3AED]">
                          {Math.round(quiz.percentage)}%
                        </p>

                        <p className="mt-1 text-xs font-medium text-[#8B8798]">
                          {quiz.score}/{quiz.questionCount} correct
                        </p>
                      </div>

                      <div className="rounded-full bg-[#F0E7FC] px-3 py-1.5 text-xs font-semibold text-[#6D28D9]">
                        {getScoreMessage(quiz.percentage)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-[#F3EDF6] pt-3 text-xs font-semibold text-[#8063A2] opacity-80 sm:text-right">
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
