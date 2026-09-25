import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";

export type SavedQuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
};

export type SavedQuizAttempt = {
  userId: string;
  quizId: string;
  title: string;
  fileName: string;
  difficulty: string;
  questionCount: number;
  score: number;
  percentage: number;
  answers: Record<number, number>;
  questions: SavedQuizQuestion[];
};

export async function saveQuizAttempt(attempt: SavedQuizAttempt) {
  const quizzesCollection = collection(db, "users", attempt.userId, "quizzes");

  const quizDocument = doc(quizzesCollection, attempt.quizId);

  await setDoc(quizDocument, {
    title: attempt.title,
    fileName: attempt.fileName,
    difficulty: attempt.difficulty,
    questionCount: attempt.questionCount,
    score: attempt.score,
    percentage: attempt.percentage,
    answers: attempt.answers,
    questions: attempt.questions,
    createdAt: serverTimestamp(),
  });

  return quizDocument.id;
}
