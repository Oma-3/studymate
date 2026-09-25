"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, Timestamp } from "firebase/firestore";
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

type SavedQuiz = {
  title: string;
  fileName: string;
  difficulty: string;
  questionCount: number;
  score: number;
  percentage: number;
  answers: Record<string, number>;
  questions: QuizQuestion[];
  createdAt?: Timestamp;
};

type PageProps = {
  params: Promise<{
    quizId: string;
  }>;
};

export default function QuizHistoryDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const { quizId } = use(params);

  const [quiz, setQuiz] = useState<SavedQuiz | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(true);
  const [error, setError] = useState("");
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    const loadQuiz = async () => {
      try {
        setLoadingQuiz(true);
        setError("");

        const quizReference = doc(db, "users", user.uid, "quizzes", quizId);

        const snapshot = await getDoc(quizReference);

        if (!snapshot.exists()) {
          setError("This study session could not be found.");
          setQuiz(null);
          return;
        }

        const data = snapshot.data();

        setQuiz({
          title: typeof data.title === "string" ? data.title : "Study Quiz",
          fileName:
            typeof data.fileName === "string" ? data.fileName : "Study notes",
          difficulty:
            typeof data.difficulty === "string" ? data.difficulty : "Balanced",
          questionCount:
            typeof data.questionCount === "number"
              ? data.questionCount
              : Array.isArray(data.questions)
                ? data.questions.length
                : 0,
          score: typeof data.score === "number" ? data.score : 0,
          percentage: typeof data.percentage === "number" ? data.percentage : 0,
          answers:
            data.answers && typeof data.answers === "object"
              ? data.answers
              : {},
          questions: Array.isArray(data.questions) ? data.questions : [],
          createdAt:
            data.createdAt instanceof Timestamp ? data.createdAt : undefined,
        });
      } catch (loadError) {
        console.error("Could not load saved quiz:", loadError);

        setError(
          "StudyMate could not load this study session. Please try again.",
        );
      } finally {
        setLoadingQuiz(false);
      }
    };

    void loadQuiz();
  }, [authLoading, user, router, quizId]);

  const incorrectCount = useMemo(() => {
    if (!quiz) {
      return 0;
    }

    return Math.max(quiz.questions.length - quiz.score, 0);
  }, [quiz]);

  const topicPerformance = useMemo(() => {
    if (!quiz) {
      return [];
    }

    const topics: Record<
      string,
      {
        total: number;
        correct: number;
      }
    > = {};

    quiz.questions.forEach((question) => {
      const topic = question.topic?.trim() || "General";

      if (!topics[topic]) {
        topics[topic] = {
          total: 0,
          correct: 0,
        };
      }

      topics[topic].total += 1;

      const selectedAnswer =
        quiz.answers[String(question.id)] ??
        quiz.answers[String(quiz.questions.indexOf(question))];

      if (selectedAnswer === question.correctAnswer) {
        topics[topic].correct += 1;
      }
    });

    return Object.entries(topics)
      .map(([topic, result]) => ({
        topic,
        total: result.total,
        correct: result.correct,
        percentage:
          result.total > 0
            ? Math.round((result.correct / result.total) * 100)
            : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [quiz]);

  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) {
      return "Date unavailable";
    }

    return timestamp.toDate().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAnswerForQuestion = (
    question: QuizQuestion,
    questionIndex: number,
  ) => {
    if (!quiz) {
      return undefined;
    }

    const byQuestionId = quiz.answers[String(question.id)];

    if (typeof byQuestionId === "number") {
      return byQuestionId;
    }

    const byIndex = quiz.answers[String(questionIndex)];

    if (typeof byIndex === "number") {
      return byIndex;
    }

    return undefined;
  };

  if (authLoading || loadingQuiz) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FDF8F3] px-6 text-[#25233A]">
        <div className="text-center">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-[#E6D9F7] border-t-[#8B5CF6]" />

          <p className="text-sm font-semibold text-[#69647B]">
            Loading your study session...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (error || !quiz) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FDF8F3] px-6">
        <div className="w-full max-w-lg rounded-[30px] border border-[#E9DFF4] bg-white p-8 text-center shadow-[0_20px_60px_rgba(67,48,98,0.08)]">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F2EAFE] text-2xl">
            ✦
          </div>

          <h1 className="text-2xl font-bold text-[#25233A]">
            We couldn&apos;t open this session
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#716C80]">
            {error || "This study session could not be found."}
          </p>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mt-7 rounded-full bg-[#7C4DFF] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#6D3FEA]"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDF8F3] text-[#25233A]">
      <header className="border-b border-[#EDE4F3] bg-[#FDF8F3]/95">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-3"
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

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-full border border-[#DCCEF0] bg-white px-4 py-2 text-sm font-semibold text-[#5C477A] transition hover:bg-[#F5EEFC]"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#73549B] transition hover:text-[#5D388B]"
        >
          <span aria-hidden="true">←</span>
          Study history
        </button>

        <section className="overflow-hidden rounded-[32px] border border-[#E7DCF0] bg-white shadow-[0_20px_70px_rgba(67,48,98,0.08)]">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#F1E8FB] px-3 py-1.5 text-xs font-bold text-[#70489E]">
                  {quiz.difficulty}
                </span>

                <span className="rounded-full bg-[#F7F2FB] px-3 py-1.5 text-xs font-semibold text-[#766985]">
                  {quiz.questions.length} questions
                </span>
              </div>

              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#9A82B5]">
                Saved study session
              </p>

              <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
                {quiz.title}
              </h1>

              <p className="mt-3 break-words text-sm leading-6 text-[#777082]">
                {quiz.fileName}
              </p>

              <p className="mt-2 text-xs font-medium text-[#A19AA9]">
                {formatDate(quiz.createdAt)}
              </p>
            </div>

            <div className="flex h-36 w-36 shrink-0 flex-col items-center justify-center rounded-full border-[10px] border-[#EADDF8] bg-[#FAF6FE] text-center">
              <span className="text-3xl font-black text-[#6F43A8]">
                {Math.round(quiz.percentage)}%
              </span>

              <span className="mt-1 text-xs font-semibold text-[#8B7B9E]">
                Your score
              </span>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[24px] border border-[#E9DFF2] bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9A8AA9]">
              Correct
            </p>

            <p className="mt-2 text-2xl font-black text-[#4C936D]">
              {quiz.score}
            </p>

            <p className="mt-1 text-xs text-[#89818F]">
              out of {quiz.questions.length}
            </p>
          </div>

          <div className="rounded-[24px] border border-[#E9DFF2] bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9A8AA9]">
              Needs review
            </p>

            <p className="mt-2 text-2xl font-black text-[#B76B6B]">
              {incorrectCount}
            </p>

            <p className="mt-1 text-xs text-[#89818F]">questions to revisit</p>
          </div>

          <div className="rounded-[24px] border border-[#E9DFF2] bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9A8AA9]">
              Difficulty
            </p>

            <p className="mt-2 text-2xl font-black text-[#7650A1]">
              {quiz.difficulty}
            </p>

            <p className="mt-1 text-xs text-[#89818F]">quiz setting</p>
          </div>
        </section>

        {topicPerformance.length > 0 && (
          <section className="mt-8 rounded-[30px] border border-[#E7DDF0] bg-white p-6 sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#9C86B4]">
                Topic performance
              </p>

              <h2 className="mt-2 text-2xl font-bold">How you did by topic</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {topicPerformance.map((topic) => (
                <div
                  key={topic.topic}
                  className="rounded-[22px] bg-[#FBF8FD] p-5"
                >
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <p className="font-bold">{topic.topic}</p>

                    <span className="text-sm font-bold text-[#7650A1]">
                      {topic.percentage}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-[#EDE5F5]">
                    <div
                      className="h-full rounded-full bg-[#8A62B8]"
                      style={{
                        width: `${topic.percentage}%`,
                      }}
                    />
                  </div>

                  <p className="mt-3 text-xs text-[#8A8291]">
                    {topic.correct} of {topic.total} correct
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#9C86B4]">
              Answer review
            </p>

            <h2 className="mt-2 text-2xl font-bold">Review every question</h2>

            <p className="mt-2 text-sm leading-6 text-[#7A7381]">
              Open a question to see your answer, the correct answer, and the
              explanation from your study notes.
            </p>
          </div>

          <div className="space-y-4">
            {quiz.questions.map((question, questionIndex) => {
              const selectedAnswer = getAnswerForQuestion(
                question,
                questionIndex,
              );

              const isCorrect = selectedAnswer === question.correctAnswer;

              const isOpen = openQuestion === questionIndex;

              return (
                <article
                  key={`${question.id}-${questionIndex}`}
                  className="overflow-hidden rounded-[26px] border border-[#E7DDF0] bg-white"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenQuestion(isOpen ? null : questionIndex)
                    }
                    className="flex w-full items-start justify-between gap-5 p-5 text-left sm:p-6"
                  >
                    <div className="flex min-w-0 gap-4">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                          isCorrect
                            ? "bg-[#E9F6EE] text-[#43835F]"
                            : "bg-[#FCEEEE] text-[#B15F5F]"
                        }`}
                      >
                        {questionIndex + 1}
                      </span>

                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              isCorrect
                                ? "bg-[#EAF6EF] text-[#4B8664]"
                                : "bg-[#FBEDED] text-[#AE6262]"
                            }`}
                          >
                            {isCorrect ? "Correct" : "Needs review"}
                          </span>

                          <span className="rounded-full bg-[#F3ECF9] px-2.5 py-1 text-[11px] font-semibold text-[#7B5C98]">
                            {question.topic || "General"}
                          </span>
                        </div>

                        <p className="font-semibold leading-6 text-[#302D42]">
                          {question.question}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`mt-2 shrink-0 text-lg text-[#846A9E] transition ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      ↓
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-[#EEE6F3] px-5 pb-6 pt-5 sm:px-6">
                      <div className="space-y-3">
                        {question.options.map((option, optionIndex) => {
                          const optionIsCorrect =
                            optionIndex === question.correctAnswer;

                          const optionWasSelected =
                            optionIndex === selectedAnswer;

                          let optionStyle = "border-[#E8E0ED] bg-[#FCFAFD]";

                          if (optionIsCorrect) {
                            optionStyle = "border-[#B9DEC7] bg-[#EFF9F2]";
                          } else if (optionWasSelected) {
                            optionStyle = "border-[#E8BEBE] bg-[#FFF3F3]";
                          }

                          return (
                            <div
                              key={optionIndex}
                              className={`rounded-[18px] border p-4 ${optionStyle}`}
                            >
                              <div className="flex items-start gap-3">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#766681]">
                                  {String.fromCharCode(65 + optionIndex)}
                                </span>

                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium leading-6 text-[#3D3947]">
                                    {option}
                                  </p>

                                  <div className="mt-1 flex flex-wrap gap-2">
                                    {optionWasSelected && (
                                      <span className="text-[11px] font-bold text-[#7D688E]">
                                        Your answer
                                      </span>
                                    )}

                                    {optionIsCorrect && (
                                      <span className="text-[11px] font-bold text-[#43835F]">
                                        Correct answer
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {typeof selectedAnswer !== "number" && (
                        <div className="mt-4 rounded-[18px] bg-[#FFF5E8] p-4 text-sm font-medium text-[#946B36]">
                          You did not answer this question.
                        </div>
                      )}

                      <div className="mt-5 rounded-[20px] bg-[#F5EFFB] p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#80619E]">
                          Explanation
                        </p>

                        <p className="mt-2 text-sm leading-7 text-[#5E5668]">
                          {question.explanation ||
                            "No explanation was saved for this question."}
                        </p>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-10 flex flex-col items-center justify-between gap-4 rounded-[28px] bg-[#EEE3F8] p-6 sm:flex-row sm:p-8">
          <div>
            <h2 className="text-xl font-bold">
              Ready for another study session?
            </h2>

            <p className="mt-1 text-sm text-[#71647D]">
              Upload another set of notes and keep building your progress.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/study")}
            className="w-full rounded-full bg-[#7045A5] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#613893] sm:w-auto"
          >
            Start New Quiz
          </button>
        </section>
      </div>
    </main>
  );
}
