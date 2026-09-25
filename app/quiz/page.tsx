"use client";

import { useEffect, useMemo, useState } from "react";
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

type QuizSettings = {
  difficulty: string;
  requestedQuestionCount: number;
  generatedQuestionCount: number;
  fileName: string;
};

export default function QuizPage() {
  const router = useRouter();

  const { user, loading: authLoading } = useAuth();

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [settings, setSettings] = useState<QuizSettings | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    try {
      const savedQuiz = sessionStorage.getItem("studymateQuiz");

      const savedSettings = sessionStorage.getItem("studymateQuizSettings");

      if (!savedQuiz) {
        router.replace("/study");
        return;
      }

      const parsedQuiz = JSON.parse(savedQuiz) as QuizData;

      if (
        !parsedQuiz.questions ||
        !Array.isArray(parsedQuiz.questions) ||
        parsedQuiz.questions.length === 0
      ) {
        router.replace("/study");
        return;
      }

      setQuiz(parsedQuiz);

      if (savedSettings) {
        setSettings(JSON.parse(savedSettings) as QuizSettings);
      }

      setIsLoading(false);
    } catch {
      router.replace("/study");
    }
  }, [authLoading, user, router]);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  if (authLoading || isLoading || !quiz) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FDF8F3] px-6">
        <div className="text-center">
          <div className="studymate-loader mx-auto">
            <div className="studymate-loader-ring" />

            <div className="studymate-loader-core">✦</div>
          </div>

          <p className="mt-6 font-semibold text-[#6D28D9]">
            {authLoading
              ? "Checking your account..."
              : !user
                ? "Taking you to login..."
                : "Getting your quiz ready..."}
          </p>
        </div>
      </main>
    );
  }

  const questions = quiz.questions;
  const question = questions[currentQuestion];

  const selectedAnswer = answers[question.id];

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const chooseAnswer = (optionIndex: number) => {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [question.id]: optionIndex,
    }));
  };

  const goNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((current) => current + 1);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const goPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((current) => current - 1);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const jumpToQuestion = (index: number) => {
    setCurrentQuestion(index);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const submitQuiz = () => {
    const result = questions.reduce((score, currentQuizQuestion) => {
      const answer = answers[currentQuizQuestion.id];

      return answer === currentQuizQuestion.correctAnswer ? score + 1 : score;
    }, 0);

    sessionStorage.setItem("studymateAnswers", JSON.stringify(answers));

    sessionStorage.setItem("studymateScore", String(result));

    router.push("/results");
  };

  return (
    <main className="min-h-screen bg-[#FDF8F3] text-[#1F2140]">
      <nav className="border-b border-[#EEE5F3] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9DDFC] text-[#7C3AED]">
              ✦
            </div>

            <span className="text-xl font-bold tracking-tight">
              Study
              <span className="text-[#7C3AED]">Mate</span>
            </span>
          </a>

          <div className="hidden items-center gap-3 sm:flex">
            {settings?.difficulty && (
              <div className="rounded-full bg-[#F2EAFE] px-4 py-2 text-xs font-bold text-[#6D28D9]">
                {settings.difficulty}
              </div>
            )}

            <div className="rounded-full border border-[#E9E1EE] bg-white px-4 py-2 text-xs font-semibold text-[#777184]">
              {answeredCount}/{questions.length} answered
            </div>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-10">
        <div className="mb-7">
          <div className="flex items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8B5CF6]">
                Your Study Session
              </p>

              <h1 className="mt-2 truncate text-2xl font-bold tracking-tight sm:text-3xl">
                {quiz.title}
              </h1>

              {settings?.fileName && (
                <p className="mt-2 truncate text-sm text-[#8B8593]">
                  Based on {settings.fileName}
                </p>
              )}
            </div>

            <p className="shrink-0 text-sm font-bold text-[#7C3AED]">
              {currentQuestion + 1} / {questions.length}
            </p>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#EDE6F2]">
            <div
              className="h-full rounded-full bg-[#7C3AED] transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="rounded-[32px] border border-[#E8DEF0] bg-white p-6 shadow-[0_18px_60px_rgba(68,52,91,0.07)] sm:p-9 lg:p-10">
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F3ECFC] px-4 py-2 text-xs font-bold text-[#6D28D9]">
                <span>✦</span>
                {question.topic}
              </div>

              <span className="text-xs font-semibold text-[#AAA3B1]">
                Question {currentQuestion + 1}
              </span>
            </div>

            <h2 className="mt-8 text-xl font-bold leading-[1.55] tracking-tight text-[#1F2140] sm:text-2xl">
              {question.question}
            </h2>

            <div className="mt-8 space-y-3">
              {question.options.map((option, optionIndex) => {
                const isSelected = selectedAnswer === optionIndex;

                const optionLetter = String.fromCharCode(65 + optionIndex);

                return (
                  <button
                    key={`${question.id}-${optionIndex}`}
                    type="button"
                    onClick={() => chooseAnswer(optionIndex)}
                    className={`group flex w-full items-center gap-4 rounded-[20px] border p-4 text-left transition-all duration-200 sm:p-5 ${
                      isSelected
                        ? "border-[#7C3AED] bg-[#F3ECFC] shadow-[0_8px_25px_rgba(124,58,237,0.10)]"
                        : "border-[#E9E2ED] bg-white hover:-translate-y-0.5 hover:border-[#C9B5E8] hover:bg-[#FCFAFE]"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition ${
                        isSelected
                          ? "bg-[#7C3AED] text-white"
                          : "bg-[#F5F1F7] text-[#6F6878] group-hover:bg-[#EDE3FA] group-hover:text-[#6D28D9]"
                      }`}
                    >
                      {optionLetter}
                    </div>

                    <span
                      className={`text-sm font-medium leading-6 sm:text-[15px] ${
                        isSelected ? "text-[#30244A]" : "text-[#5F5969]"
                      }`}
                    >
                      {option}
                    </span>

                    <div
                      className={`ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                        isSelected
                          ? "border-[#7C3AED] bg-[#7C3AED]"
                          : "border-[#D8D0DD]"
                      }`}
                    >
                      {isSelected && (
                        <span className="text-[10px] text-white">✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-10 flex items-center justify-between gap-4 border-t border-[#F0EAF3] pt-7">
              <button
                type="button"
                onClick={goPrevious}
                disabled={currentQuestion === 0}
                className="rounded-full border border-[#DED5E5] bg-white px-6 py-3 text-sm font-semibold text-[#625B6C] transition hover:border-[#BDA8D8] hover:text-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-35"
              >
                ← Previous
              </button>

              {currentQuestion < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-full bg-[#7C3AED] px-7 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(124,58,237,0.18)] transition hover:-translate-y-0.5 hover:bg-[#6D28D9]"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitQuiz}
                  className="rounded-full bg-[#1F2140] px-7 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(31,33,64,0.16)] transition hover:-translate-y-0.5 hover:bg-[#2D3057]"
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </section>

          <aside className="h-fit rounded-[28px] border border-[#E8DEF0] bg-white p-5 shadow-[0_14px_45px_rgba(68,52,91,0.05)] lg:sticky lg:top-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-[#1F2140]">Quiz progress</p>

                <p className="mt-1 text-xs text-[#918B9B]">
                  Jump to any question
                </p>
              </div>

              <div className="rounded-xl bg-[#F2EAFE] px-3 py-2 text-xs font-bold text-[#6D28D9]">
                {Math.round((answeredCount / questions.length) * 100)}%
              </div>
            </div>

            <div className="mt-6 grid grid-cols-5 gap-2">
              {questions.map((quizQuestion, index) => {
                const isCurrent = index === currentQuestion;

                const isAnswered = answers[quizQuestion.id] !== undefined;

                return (
                  <button
                    key={quizQuestion.id}
                    type="button"
                    onClick={() => jumpToQuestion(index)}
                    aria-label={`Go to question ${index + 1}`}
                    className={`aspect-square rounded-xl text-xs font-bold transition ${
                      isCurrent
                        ? "bg-[#7C3AED] text-white shadow-[0_6px_16px_rgba(124,58,237,0.20)]"
                        : isAnswered
                          ? "bg-[#EDE3FA] text-[#6D28D9] hover:bg-[#E3D4F7]"
                          : "bg-[#F6F3F7] text-[#918B9B] hover:bg-[#EEE8F2]"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 border-t border-[#F0EAF3] pt-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#918B9B]">Answered</span>

                <span className="font-bold text-[#1F2140]">
                  {answeredCount} of {questions.length}
                </span>
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EEE8F2]">
                <div
                  className="h-full rounded-full bg-[#A78BFA] transition-all duration-300"
                  style={{
                    width: `${(answeredCount / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <p className="mt-5 text-xs leading-5 text-[#9A94A3]">
              You can change any answer before submitting your quiz.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
