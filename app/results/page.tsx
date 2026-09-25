"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { saveQuizAttempt } from "@/lib/quizHistory";

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
  quizId?: string;
  difficulty: string;
  requestedQuestionCount: number;
  generatedQuestionCount: number;
  fileName: string;
};

type Answers = Record<number, number>;

export default function ResultsPage() {
  const router = useRouter();

  const { user, loading: authLoading } = useAuth();

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [settings, setSettings] = useState<QuizSettings | null>(null);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

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

      const savedAnswers = sessionStorage.getItem("studymateAnswers");

      const savedScore = sessionStorage.getItem("studymateScore");

      const savedSettings = sessionStorage.getItem("studymateQuizSettings");

      if (!savedQuiz || !savedAnswers) {
        router.replace("/study");
        return;
      }

      const parsedQuiz = JSON.parse(savedQuiz) as QuizData;

      const parsedAnswers = JSON.parse(savedAnswers) as Answers;

      if (
        !parsedQuiz.questions ||
        !Array.isArray(parsedQuiz.questions) ||
        parsedQuiz.questions.length === 0
      ) {
        router.replace("/study");
        return;
      }

      setQuiz(parsedQuiz);
      setAnswers(parsedAnswers);
      setScore(Number(savedScore ?? 0));

      if (savedSettings) {
        setSettings(JSON.parse(savedSettings) as QuizSettings);
      }

      setIsLoading(false);
    } catch {
      router.replace("/study");
    }
  }, [authLoading, user, router]);

  const topicPerformance = useMemo(() => {
    if (!quiz) {
      return [];
    }

    const topics: Record<
      string,
      {
        correct: number;
        total: number;
      }
    > = {};

    quiz.questions.forEach((question) => {
      if (!topics[question.topic]) {
        topics[question.topic] = {
          correct: 0,
          total: 0,
        };
      }

      topics[question.topic].total += 1;

      if (answers[question.id] === question.correctAnswer) {
        topics[question.topic].correct += 1;
      }
    });

    return Object.entries(topics)
      .map(([topic, performance]) => ({
        topic,
        ...performance,
        percentage: Math.round((performance.correct / performance.total) * 100),
      }))
      .sort((first, second) => second.percentage - first.percentage);
  }, [quiz, answers]);

  const totalQuestions = quiz?.questions.length ?? 0;

  const percentage =
    totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  useEffect(() => {
    if (
      authLoading ||
      isLoading ||
      !user ||
      !quiz ||
      !settings?.quizId ||
      totalQuestions === 0
    ) {
      return;
    }

    let cancelled = false;

    const saveCompletedQuiz = async () => {
      try {
        setSaveStatus("saving");

        await saveQuizAttempt({
          userId: user.uid,
          quizId: settings.quizId as string,
          title: quiz.title,
          fileName: settings.fileName || "Study notes",
          difficulty: settings.difficulty || "Balanced",
          questionCount: totalQuestions,
          score,
          percentage,
          answers,
          questions: quiz.questions,
        });

        if (!cancelled) {
          setSaveStatus("saved");
        }
      } catch (error) {
        console.error("StudyMate quiz history save error:", error);

        if (!cancelled) {
          setSaveStatus("error");
        }
      }
    };

    saveCompletedQuiz();

    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    isLoading,
    user,
    quiz,
    settings,
    totalQuestions,
    score,
    percentage,
    answers,
  ]);

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
                : "Checking your results..."}
          </p>
        </div>
      </main>
    );
  }

  const incorrectCount = totalQuestions - score;

  const answeredCount = Object.keys(answers).length;

  const getFeedback = () => {
    if (percentage >= 90) {
      return {
        title: "Excellent work!",
        message: "You have a really strong grasp of these notes.",
      };
    }

    if (percentage >= 75) {
      return {
        title: "Great job!",
        message:
          "You understand most of the material. A quick review of the missed areas will make it even stronger.",
      };
    }

    if (percentage >= 50) {
      return {
        title: "Good progress!",
        message:
          "You have a solid start. Review the areas you missed and give them another go.",
      };
    }

    return {
      title: "Keep going!",
      message:
        "This is a useful starting point. Focus on the topics below, then try the quiz again.",
    };
  };

  const feedback = getFeedback();

  const strongestTopics = topicPerformance.filter(
    (topic) => topic.percentage >= 75,
  );

  const needsReviewTopics = topicPerformance.filter(
    (topic) => topic.percentage < 75,
  );

  const retakeQuiz = () => {
    sessionStorage.removeItem("studymateAnswers");

    sessionStorage.removeItem("studymateScore");

    /*
     * A retake should become a new quiz
     * attempt in Firestore rather than
     * overwrite the previous result.
     */
    if (settings) {
      const newQuizId = crypto.randomUUID();

      const updatedSettings = {
        ...settings,
        quizId: newQuizId,
      };

      sessionStorage.setItem(
        "studymateQuizSettings",
        JSON.stringify(updatedSettings),
      );
    }

    router.push("/quiz");
  };

  const retakeIncorrectQuestions = () => {
    const incorrectQuestions = quiz.questions.filter(
      (question) => answers[question.id] !== question.correctAnswer,
    );

    if (incorrectQuestions.length === 0) {
      return;
    }

    /*
     * Remove any previous "Mistakes Review"
     * labels before creating the next round.
     * This prevents:
     *
     * Quiz · Mistakes Review · Mistakes Review
     */
    const originalQuizTitle = quiz.title
      .replace(/(?:\s*·\s*Mistakes Review)+\s*$/i, "")
      .trim();

    const reviewQuiz: QuizData = {
      ...quiz,
      title: `${originalQuizTitle} · Mistakes Review`,
      questions: incorrectQuestions,
    };

    const newQuizId = crypto.randomUUID();

    const updatedSettings: QuizSettings = {
      quizId: newQuizId,
      difficulty: settings?.difficulty || "Balanced",
      requestedQuestionCount: incorrectQuestions.length,
      generatedQuestionCount: incorrectQuestions.length,
      fileName: settings?.fileName || "Study notes",
    };

    sessionStorage.setItem("studymateQuiz", JSON.stringify(reviewQuiz));

    sessionStorage.setItem(
      "studymateQuizSettings",
      JSON.stringify(updatedSettings),
    );

    sessionStorage.removeItem("studymateAnswers");

    sessionStorage.removeItem("studymateScore");

    router.push("/quiz");
  };

  const studySomethingElse = () => {
    sessionStorage.removeItem("studymateQuiz");

    sessionStorage.removeItem("studymateQuizSettings");

    sessionStorage.removeItem("studymateAnswers");

    sessionStorage.removeItem("studymateScore");

    router.push("/study");
  };

  return (
    <main className="min-h-screen bg-[#FDF8F3] text-[#1F2140]">
      <nav className="border-b border-[#EEE5F3] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <a href="/" className="flex items-center gap-3">
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

          <button
            type="button"
            onClick={studySomethingElse}
            className="text-sm font-semibold text-[#6F6A7A] transition hover:text-[#7C3AED]"
          >
            New Quiz
          </button>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-10 lg:px-10">
        <div className="relative overflow-hidden rounded-[36px] border border-[#E4D7F1] bg-white px-6 py-10 shadow-[0_24px_80px_rgba(68,52,91,0.08)] sm:px-10 lg:px-14">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#EADDFC] opacity-70 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-[#F3E8FC] opacity-60 blur-3xl" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F0E7FC] px-4 py-2 text-xs font-bold text-[#6D28D9]">
                <span>✦</span>
                QUIZ COMPLETE
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                {feedback.title}
              </h1>

              <p className="mt-3 max-w-xl leading-7 text-[#716B7A]">
                {feedback.message}
              </p>

              <p className="mt-5 text-sm font-semibold text-[#8B5CF6]">
                {quiz.title}
              </p>

              {settings?.fileName && (
                <p className="mt-1 text-xs text-[#9A94A3]">
                  Based on {settings.fileName}
                </p>
              )}

              {saveStatus === "saving" && (
                <p className="mt-3 text-xs font-medium text-[#8B5CF6]">
                  Saving this study session...
                </p>
              )}

              {saveStatus === "saved" && (
                <p className="mt-3 text-xs font-medium text-[#38865A]">
                  ✓ Saved to your study history
                </p>
              )}

              {saveStatus === "error" && (
                <p className="mt-3 text-xs font-medium text-[#C46B55]">
                  Your result is safe on this page, but StudyMate could not save
                  it to your history.
                </p>
              )}
            </div>

            <div className="flex justify-center">
              <div
                className="relative flex h-44 w-44 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#7C3AED ${percentage}%, #EEE7F4 ${percentage}% 100%)`,
                }}
              >
                <div className="flex h-[142px] w-[142px] flex-col items-center justify-center rounded-full bg-white shadow-inner">
                  <span className="text-4xl font-bold tracking-tight text-[#1F2140]">
                    {percentage}%
                  </span>

                  <span className="mt-1 text-xs font-semibold text-[#918B9B]">
                    {score} of {totalQuestions}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[24px] border border-[#E7DCEF] bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#918B9B]">
              Correct
            </p>

            <p className="mt-2 text-3xl font-bold text-[#38865A]">{score}</p>

            <p className="mt-1 text-sm text-[#777184]">
              questions answered correctly
            </p>
          </div>

          <div className="rounded-[24px] border border-[#E7DCEF] bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#918B9B]">
              Needs Review
            </p>

            <p className="mt-2 text-3xl font-bold text-[#C46B55]">
              {incorrectCount}
            </p>

            <p className="mt-1 text-sm text-[#777184]">
              questions to look at again
            </p>
          </div>

          <div className="rounded-[24px] border border-[#E7DCEF] bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#918B9B]">
              Answered
            </p>

            <p className="mt-2 text-3xl font-bold text-[#7C3AED]">
              {answeredCount}/{totalQuestions}
            </p>

            <p className="mt-1 text-sm text-[#777184]">questions completed</p>
          </div>
        </div>

        {topicPerformance.length > 0 && (
          <section className="mt-8">
            <div>
              <p className="text-sm font-semibold text-[#7C3AED]">
                YOUR TOPICS
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                See where you&apos;re strongest
              </h2>

              <p className="mt-2 text-sm text-[#777184]">
                Your results are grouped using the topics found in your notes.
              </p>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="rounded-[28px] border border-[#DCECDF] bg-[#F8FCF9] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4F4E8] text-[#38865A]">
                    ✓
                  </div>

                  <div>
                    <h3 className="font-bold">Strong topics</h3>

                    <p className="text-xs text-[#7D897F]">
                      Areas you handled well
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {strongestTopics.length > 0 ? (
                    strongestTopics.map((topic) => (
                      <div
                        key={topic.topic}
                        className="rounded-2xl bg-white p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm font-semibold">
                            {topic.topic}
                          </span>

                          <span className="text-sm font-bold text-[#38865A]">
                            {topic.percentage}%
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-[#8A948C]">
                          {topic.correct} of {topic.total} correct
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl bg-white p-4 text-sm leading-6 text-[#7B847D]">
                      Keep practising. Your strong areas will appear here as
                      your scores improve.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-[#ECDDD8] bg-[#FFF9F7] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F9E8E3] text-[#C46B55]">
                    ↗
                  </div>

                  <div>
                    <h3 className="font-bold">Worth another look</h3>

                    <p className="text-xs text-[#94827D]">
                      Topics to spend more time on
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {needsReviewTopics.length > 0 ? (
                    needsReviewTopics.map((topic) => (
                      <div
                        key={topic.topic}
                        className="rounded-2xl bg-white p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm font-semibold">
                            {topic.topic}
                          </span>

                          <span className="text-sm font-bold text-[#C46B55]">
                            {topic.percentage}%
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-[#978A86]">
                          {topic.correct} of {topic.total} correct
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl bg-white p-4 text-sm leading-6 text-[#897C78]">
                      Nice work. Nothing stands out as needing extra review from
                      this quiz.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="mt-10">
          <div>
            <p className="text-sm font-semibold text-[#7C3AED]">
              ANSWER REVIEW
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Learn from every question
            </h2>

            <p className="mt-2 text-sm text-[#777184]">
              Open any question to see the correct answer and explanation.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {quiz.questions.map((question, index) => {
              const selectedAnswer = answers[question.id];

              const isCorrect = selectedAnswer === question.correctAnswer;

              const isExpanded = expandedQuestion === question.id;

              return (
                <div
                  key={question.id}
                  className="overflow-hidden rounded-[22px] border border-[#E7DCEF] bg-white"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedQuestion(isExpanded ? null : question.id)
                    }
                    className="flex w-full items-center gap-4 p-5 text-left sm:p-6"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                        isCorrect
                          ? "bg-[#E6F4E9] text-[#38865A]"
                          : "bg-[#FAE9E4] text-[#C46B55]"
                      }`}
                    >
                      {isCorrect ? "✓" : "×"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#8B5CF6]">
                        Question {index + 1} · {question.topic}
                      </p>

                      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-[#332D3B]">
                        {question.question}
                      </p>
                    </div>

                    <span className="shrink-0 text-xl text-[#918B9B]">
                      {isExpanded ? "−" : "+"}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[#F0EAF3] px-5 pb-6 pt-5 sm:px-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl bg-[#F8F5FA] p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#918B9B]">
                            Your answer
                          </p>

                          <p
                            className={`mt-2 text-sm font-semibold ${
                              isCorrect ? "text-[#38865A]" : "text-[#C46B55]"
                            }`}
                          >
                            {selectedAnswer !== undefined
                              ? question.options[selectedAnswer]
                              : "Not answered"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[#F4FBF6] p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#718176]">
                            Correct answer
                          </p>

                          <p className="mt-2 text-sm font-semibold text-[#38865A]">
                            {question.options[question.correctAnswer]}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-[#E4D7F1] bg-[#FAF7FD] p-5">
                        <div className="flex items-center gap-2">
                          <span className="text-[#7C3AED]">✦</span>

                          <p className="text-sm font-bold text-[#332D3B]">
                            Why?
                          </p>
                        </div>

                        <p className="mt-2 text-sm leading-7 text-[#6F6878]">
                          {question.explanation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <button
            type="button"
            onClick={retakeQuiz}
            className="rounded-full border border-[#CDBAE5] bg-white px-7 py-3.5 text-sm font-semibold text-[#6D28D9] transition hover:bg-[#F7F1FC]"
          >
            Retake This Quiz
          </button>

          {incorrectCount > 0 && (
            <button
              type="button"
              onClick={retakeIncorrectQuestions}
              className="rounded-full bg-[#7C3AED] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(124,58,237,0.18)] transition hover:-translate-y-0.5 hover:bg-[#6D28D9]"
            >
              Practice Mistakes ({incorrectCount})
            </button>
          )}

          <button
            type="button"
            onClick={studySomethingElse}
            className="rounded-full border border-[#CDBAE5] bg-white px-7 py-3.5 text-sm font-semibold text-[#6D28D9] transition hover:bg-[#F7F1FC]"
          >
            Study Something Else
          </button>
        </div>
      </section>
    </main>
  );
}
