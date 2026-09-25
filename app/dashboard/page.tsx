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

type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
};

type QuizHistoryItem = {
  id: string;
  title: string;
  fileName: string;
  difficulty: string;
  questionCount: number;
  score: number;
  percentage: number;
  createdAt: Timestamp | null;
  answers: Record<string, number>;
  questions: QuizQuestion[];
};

type TopicPerformanceItem = {
  topic: string;
  correct: number;
  total: number;
  percentage: number;
};

export default function DashboardPage() {
  const router = useRouter();

  const { user, loading: authLoading, logout } = useAuth();

  const [quizzes, setQuizzes] = useState<QuizHistoryItem[]>([]);

  const [loadingHistory, setLoadingHistory] = useState(true);

  const [error, setError] = useState("");

  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

            answers:
              data.answers && typeof data.answers === "object"
                ? (data.answers as Record<string, number>)
                : {},

            questions: Array.isArray(data.questions)
              ? (data.questions as QuizQuestion[])
              : [],
          };
        });

        setQuizzes(quizHistory);
      } catch (error) {
        console.error("StudyMate dashboard error:", error);

        setError(
          "We couldn't load your study history right now. Please try again.",
        );
      } finally {
        setLoadingHistory(false);
      }
    };

    void loadQuizHistory();
  }, [authLoading, user]);

  const totalQuizzes = quizzes.length;

  const recentQuizzes = useMemo(() => quizzes.slice(0, 3), [quizzes]);

  const averageScore = useMemo(() => {
    if (quizzes.length === 0) {
      return 0;
    }

    const total = quizzes.reduce((sum, quiz) => sum + quiz.percentage, 0);

    return Math.round(total / quizzes.length);
  }, [quizzes]);

  const bestScore = useMemo(() => {
    if (quizzes.length === 0) {
      return 0;
    }

    return Math.round(Math.max(...quizzes.map((quiz) => quiz.percentage)));
  }, [quizzes]);

  const topicPerformance = useMemo<TopicPerformanceItem[]>(() => {
    const topics: Record<
      string,
      {
        correct: number;
        total: number;
      }
    > = {};

    quizzes.forEach((quiz) => {
      quiz.questions.forEach((question, questionIndex) => {
        const topic = question.topic?.trim() || "General";

        if (!topics[topic]) {
          topics[topic] = {
            correct: 0,
            total: 0,
          };
        }

        topics[topic].total += 1;

        const answerByQuestionId = quiz.answers[String(question.id)];

        const answerByIndex = quiz.answers[String(questionIndex)];

        const selectedAnswer =
          typeof answerByQuestionId === "number"
            ? answerByQuestionId
            : answerByIndex;

        if (selectedAnswer === question.correctAnswer) {
          topics[topic].correct += 1;
        }
      });
    });

    return Object.entries(topics)
      .map(([topic, result]) => ({
        topic,
        correct: result.correct,
        total: result.total,
        percentage:
          result.total > 0
            ? Math.round((result.correct / result.total) * 100)
            : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage || b.total - a.total);
  }, [quizzes]);

  const strongTopics = useMemo(
    () =>
      topicPerformance.filter((topic) => topic.percentage >= 75).slice(0, 4),
    [topicPerformance],
  );

  const reviewTopics = useMemo(
    () =>
      topicPerformance
        .filter((topic) => topic.percentage < 75)
        .sort((a, b) => a.percentage - b.percentage || b.total - a.total)
        .slice(0, 4),
    [topicPerformance],
  );

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
          <img
            src="/studyMate-logo.png"
            alt="StudyMate"
            className="mx-auto h-20 w-20 object-contain"
          />

          <p className="mt-4 text-sm font-medium text-[#747184]">
            Opening your dashboard...
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
      {/* Navbar */}
      <nav className="border-b border-[#EEE6F4] bg-[#FDF8F3]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-10">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex shrink-0 items-center gap-1 sm:gap-2"
          >
            <img
              src="/studyMate-logo.png"
              alt="StudyMate logo"
              className="h-16 w-16 shrink-0 object-contain sm:h-20 sm:w-20"
            />

            <span className="text-xl font-bold tracking-tight sm:text-2xl">
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
              className="hidden rounded-full bg-[#F0E7FC] px-4 py-2 text-sm font-semibold text-[#7C3AED] sm:block"
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={() => router.push("/history")}
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-[#5E5870] transition hover:bg-[#F2EAFE] hover:text-[#7C3AED] sm:block"
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
        {/* Welcome */}
        <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#F0E7FC] px-4 py-2 text-xs font-semibold text-[#6D28D9] sm:text-sm">
              <span>✦</span>
              Your study space
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[#1F2140] sm:text-4xl lg:text-5xl">
              Welcome back, <span className="text-[#7C3AED]">{firstName}.</span>
            </h1>

            <p className="mt-3 max-w-xl text-base leading-7 text-[#706C7C] sm:text-lg">
              Here&apos;s a look at how your study sessions are going.
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

        {/* Statistics */}
        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[28px] border border-[#E8DDF5] bg-white p-6 shadow-[0_10px_35px_rgba(75,55,110,0.05)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F0E7FC] text-lg text-[#7C3AED]">
              ✦
            </div>

            <p className="mt-6 text-sm font-medium text-[#858091]">
              Total quizzes
            </p>

            <p className="mt-1 text-3xl font-bold text-[#1F2140]">
              {loadingHistory ? "..." : totalQuizzes}
            </p>

            <p className="mt-2 text-xs text-[#9993A3]">
              Study sessions completed
            </p>
          </div>

          <div className="rounded-[28px] border border-[#E8DDF5] bg-[#F3ECFC] p-6 shadow-[0_10px_35px_rgba(75,55,110,0.05)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg text-[#7C3AED]">
              ◎
            </div>

            <p className="mt-6 text-sm font-medium text-[#777184]">
              Average score
            </p>

            <p className="mt-1 text-3xl font-bold text-[#7C3AED]">
              {loadingHistory ? "..." : `${averageScore}%`}
            </p>

            <p className="mt-2 text-xs text-[#8E879A]">
              Across all your quizzes
            </p>
          </div>

          <div className="rounded-[28px] bg-[#292544] p-6 text-white shadow-[0_10px_35px_rgba(41,37,68,0.12)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-lg text-[#C4B5FD]">
              ↗
            </div>

            <p className="mt-6 text-sm font-medium text-[#C9C4D4]">
              Best score
            </p>

            <p className="mt-1 text-3xl font-bold">
              {loadingHistory ? "..." : `${bestScore}%`}
            </p>

            <p className="mt-2 text-xs text-[#AAA5B6]">
              Your highest result so far
            </p>
          </div>
        </section>

        {/* Learning Analytics */}
        {!loadingHistory && topicPerformance.length > 0 && (
          <section className="mt-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7C3AED]">
                Learning insights
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#1F2140] sm:text-3xl">
                See where you&apos;re strongest
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7A7485] sm:text-base">
                StudyMate combines your completed quizzes to show the topics
                you&apos;re handling well and the ones worth revisiting.
              </p>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="rounded-[28px] border border-[#DDEBDF] bg-[#F7FCF8] p-6 sm:p-7">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E4F3E8] text-lg text-[#4D8760]">
                    ✓
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[#283C30]">
                      Strong topics
                    </h3>

                    <p className="mt-1 text-sm text-[#718078]">
                      Topics where you have scored 75% or higher.
                    </p>
                  </div>
                </div>

                {strongTopics.length > 0 ? (
                  <div className="mt-6 space-y-5">
                    {strongTopics.map((topic) => (
                      <div key={topic.topic}>
                        <div className="flex items-center justify-between gap-4">
                          <p className="truncate text-sm font-semibold text-[#38473D]">
                            {topic.topic}
                          </p>

                          <span className="shrink-0 text-sm font-bold text-[#4D8760]">
                            {topic.percentage}%
                          </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#DFEDE2]">
                          <div
                            className="h-full rounded-full bg-[#6A9B79]"
                            style={{
                              width: `${topic.percentage}%`,
                            }}
                          />
                        </div>

                        <p className="mt-2 text-xs text-[#7D8A81]">
                          {topic.correct} of {topic.total} correct
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl bg-white/70 p-5">
                    <p className="text-sm leading-6 text-[#718078]">
                      Keep studying. A topic will appear here once your overall
                      score for it reaches 75%.
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-[28px] border border-[#EEDDDD] bg-[#FFF9F8] p-6 sm:p-7">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F8E9E6] text-lg text-[#B06A62]">
                    ↗
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[#4A3432]">
                      Topics to review
                    </h3>

                    <p className="mt-1 text-sm text-[#8A7471]">
                      Topics where a little more practice could help.
                    </p>
                  </div>
                </div>

                {reviewTopics.length > 0 ? (
                  <div className="mt-6 space-y-5">
                    {reviewTopics.map((topic) => (
                      <div key={topic.topic}>
                        <div className="flex items-center justify-between gap-4">
                          <p className="truncate text-sm font-semibold text-[#4E3C3A]">
                            {topic.topic}
                          </p>

                          <span className="shrink-0 text-sm font-bold text-[#B06A62]">
                            {topic.percentage}%
                          </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F0E1DE]">
                          <div
                            className="h-full rounded-full bg-[#C98278]"
                            style={{
                              width: `${topic.percentage}%`,
                            }}
                          />
                        </div>

                        <p className="mt-2 text-xs text-[#927E7B]">
                          {topic.correct} of {topic.total} correct
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl bg-white/70 p-5">
                    <p className="text-sm leading-6 text-[#8A7471]">
                      Nice work. None of your saved topics currently fall below
                      75%.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Recent Sessions */}
        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7C3AED]">
                Study history
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#1F2140] sm:text-3xl">
                Recent study sessions
              </h2>
            </div>

            {!loadingHistory && quizzes.length > 0 && (
              <button
                type="button"
                onClick={() => router.push("/history")}
                className="shrink-0 rounded-full border border-[#D8C6F3] bg-white px-4 py-2 text-xs font-semibold text-[#6D28D9] transition hover:border-[#B99AE0] hover:bg-[#F5EFFC] sm:px-5 sm:py-2.5 sm:text-sm"
              >
                View All History →
              </button>
            )}
          </div>

          {loadingHistory ? (
            <div className="mt-6 rounded-[28px] border border-[#E8E1EC] bg-white p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0E7FC] text-xl text-[#7C3AED]">
                ✦
              </div>

              <p className="mt-4 font-semibold text-[#403A54]">
                Loading your study history...
              </p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-dashed border-[#D8C6F3] bg-white/60 px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0E7FC] text-2xl text-[#7C3AED]">
                📚
              </div>

              <h3 className="mt-5 text-xl font-bold text-[#1F2140]">
                No study sessions yet
              </h3>

              <p className="mx-auto mt-2 max-w-md leading-7 text-[#747184]">
                Complete your first quiz and it will appear here.
              </p>

              <button
                type="button"
                onClick={() => router.push("/study")}
                className="mt-6 rounded-full bg-[#7C3AED] px-6 py-3 font-semibold text-white transition hover:bg-[#6D28D9]"
              >
                Start Studying
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {recentQuizzes.map((quiz) => (
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
