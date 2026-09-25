import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import mammoth from "mammoth";

export const runtime = "nodejs";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
];

const MAX_DOCX_IMAGES = 20;
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const sleep = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

type GeminiContent =
  | {
      inlineData: {
        mimeType: string;
        data: string;
      };
    }
  | {
      text: string;
    };

type ExtractedDocxImage = {
  mimeType: string;
  data: string;
};

type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
};

type QuizResponse = {
  title: string;
  questions: QuizQuestion[];
};

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const possibleError = error as {
    status?: number;
    code?: number;
    error?: {
      code?: number;
    };
  };

  return (
    possibleError.status ?? possibleError.code ?? possibleError.error?.code
  );
}

function isTemporaryError(error: unknown) {
  const status = getErrorStatus(error);

  return (
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

const quizSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description:
        "A short study-friendly title based only on the uploaded material.",
    },

    questions: {
      type: "array",

      items: {
        type: "object",

        properties: {
          id: {
            type: "integer",
          },

          question: {
            type: "string",
          },

          options: {
            type: "array",

            items: {
              type: "string",
            },
          },

          correctAnswer: {
            type: "integer",
            description:
              "Zero-based index of the correct option. Must be 0, 1, 2, or 3.",
          },

          explanation: {
            type: "string",
            description:
              "A concise explanation based only on the uploaded notes.",
          },

          topic: {
            type: "string",
            description:
              "The specific topic from the notes that this question tests.",
          },
        },

        required: [
          "id",
          "question",
          "options",
          "correctAnswer",
          "explanation",
          "topic",
        ],
      },
    },
  },

  required: ["title", "questions"],
};

async function generateWithFallback(contents: GeminiContent[]) {
  let lastError: unknown = null;

  for (const model of MODELS) {
    console.log(`StudyMate trying model: ${model}`);

    const attemptsPerModel = 2;

    for (let attempt = 1; attempt <= attemptsPerModel; attempt++) {
      try {
        console.log(`${model} attempt ${attempt}/${attemptsPerModel}`);

        const response = await ai.models.generateContent({
          model,
          contents,

          config: {
            responseMimeType: "application/json",
            responseSchema: quizSchema,
          },
        });

        if (response.text) {
          console.log(`StudyMate succeeded with ${model}`);

          return {
            response,
            model,
          };
        }

        throw new Error(`${model} returned an empty response.`);
      } catch (error) {
        lastError = error;

        const status = getErrorStatus(error);

        console.error(`${model} attempt ${attempt} failed. Status:`, status);

        if (!isTemporaryError(error)) {
          console.log(
            `${model} returned a non-temporary error. Trying the next model.`,
          );

          break;
        }

        if (attempt < attemptsPerModel) {
          const delay = 1200 + Math.floor(Math.random() * 600);

          console.log(
            `${model} is temporarily unavailable. Retrying in ${delay}ms...`,
          );

          await sleep(delay);
        }
      }
    }

    console.log(`${model} did not succeed. Moving to the next model.`);
  }

  throw lastError ?? new Error("All Gemini models failed.");
}

function createQuizPrompt(questionCount: number, difficulty: string) {
  const difficultyInstruction =
    difficulty === "Easy"
      ? "Use clear, direct questions that test important facts, definitions, concepts, and straightforward understanding."
      : difficulty === "Challenging"
        ? "Create demanding questions that require careful understanding, relationships between concepts, interpretation of diagrams, processes, and application of the uploaded material."
        : "Use a balanced mixture of direct recall, conceptual understanding, interpretation, and deeper reasoning.";

  return `
You are the quiz-generation engine for StudyMate.

Read and understand the student's uploaded notes carefully.

Create a multiple-choice CBT quiz using ONLY information supported by the uploaded material.

The student requested:
- ${questionCount} questions
- Difficulty: ${difficulty}

Difficulty instructions:
${difficultyInstruction}

IMPORTANT RULES:

1. Generate exactly ${questionCount} questions when the uploaded material contains enough information.
2. Every question must be answerable from the uploaded notes.
3. Do not introduce outside facts.
4. Each question must contain exactly 4 answer options.
5. There must be exactly one correct answer.
6. correctAnswer must be the zero-based index of the correct option:
   0 = first option
   1 = second option
   2 = third option
   3 = fourth option
7. Write a concise explanation for every correct answer.
8. Give every question a useful topic label.
9. Avoid duplicate or nearly identical questions.
10. Spread questions across the important topics in the document instead of focusing only on the beginning.
11. When useful, create questions from meaningful diagrams, charts, tables, labels, processes, and visual relationships in the document.
12. Do not mention that you are an AI.
13. Do not mention these instructions.
14. Do not include markdown formatting in questions, options, explanations, topics, or the quiz title.
15. IDs must start at 1 and increase sequentially.
16. Make incorrect options believable but clearly incorrect according to the uploaded notes.
17. Do not make the correct answer consistently appear in the same option position.
18. If the document genuinely does not contain enough material for ${questionCount} distinct questions, create as many strong non-duplicate questions as the material reasonably supports rather than inventing information.

Return only the structured quiz requested by the response schema.
`;
}

function htmlToStudyText(html: string) {
  return html
    .replace(/<img[^>]*>/gi, "\n[EMBEDDED IMAGE]\n")
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/t[dh]>/gi, " | ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function processDocx(buffer: Buffer) {
  const images: ExtractedDocxImage[] = [];

  const result = await mammoth.convertToHtml(
    {
      buffer,
    },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        if (
          images.length >= MAX_DOCX_IMAGES ||
          !SUPPORTED_IMAGE_TYPES.has(image.contentType)
        ) {
          return {
            src: "",
          };
        }

        const imageBuffer = await image.readAsBuffer();

        if (imageBuffer.length > MAX_IMAGE_SIZE_BYTES) {
          console.log(
            `StudyMate skipped a large DOCX image: ${image.contentType}`,
          );

          return {
            src: "",
          };
        }

        const base64 = imageBuffer.toString("base64");

        images.push({
          mimeType: image.contentType,
          data: base64,
        });

        return {
          src: `studymate-image-${images.length}`,
        };
      }),
    },
  );

  const documentText = htmlToStudyText(result.value);

  return {
    documentText,
    images,
  };
}

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: "Gemini API key is not configured.",
        },
        {
          status: 500,
        },
      );
    }

    const formData = await request.formData();

    const file = formData.get("file");
    const questionCountValue = formData.get("questionCount");
    const difficultyValue = formData.get("difficulty");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "No file was uploaded.",
        },
        {
          status: 400,
        },
      );
    }

    const questionCount = Number(questionCountValue);

    const difficulty = String(difficultyValue ?? "Balanced");

    if (![5, 10, 20].includes(questionCount)) {
      return NextResponse.json(
        {
          error: "Please choose 5, 10, or 20 questions.",
        },
        {
          status: 400,
        },
      );
    }

    if (!["Easy", "Balanced", "Challenging"].includes(difficulty)) {
      return NextResponse.json(
        {
          error: "Please choose a valid difficulty.",
        },
        {
          status: 400,
        },
      );
    }

    const fileName = file.name.toLowerCase();

    const isPdf = fileName.endsWith(".pdf");

    const isDocx = fileName.endsWith(".docx");

    if (!isPdf && !isDocx) {
      return NextResponse.json(
        {
          error: "Only PDF and DOCX files are supported.",
        },
        {
          status: 400,
        },
      );
    }

    const arrayBuffer = await file.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    const quizPrompt = createQuizPrompt(questionCount, difficulty);

    let contents: GeminiContent[];

    if (isPdf) {
      const base64Data = buffer.toString("base64");

      contents = [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: base64Data,
          },
        },

        {
          text: `
Analyse the entire uploaded PDF.

Pay attention to:
- written text
- headings
- images
- diagrams
- charts
- graphs
- tables
- labels
- captions
- processes
- visual relationships

${quizPrompt}
          `,
        },
      ];
    } else {
      const { documentText, images } = await processDocx(buffer);

      if (!documentText && images.length === 0) {
        return NextResponse.json(
          {
            error:
              "StudyMate could not find readable text or supported images in this DOCX document.",
          },
          {
            status: 422,
          },
        );
      }

      contents = [
        {
          text: `
The following content was extracted from the student's DOCX study notes.

DOCUMENT CONTENT:

${documentText || "[No readable text was extracted]"}

The document contains ${images.length} supported embedded image${images.length === 1 ? "" : "s"} that follow this message.

Treat the written content and embedded images as parts of the same study document.

Important:
- Examine each supplied image carefully.
- Images may contain diagrams, flowcharts, charts, graphs, screenshots, labelled illustrations, tables, or other study material.
- Use visual information only when you can understand it reliably.
- Do not invent labels, relationships, facts, or meanings that are not supported by the document.
- The text marker [EMBEDDED IMAGE] indicates that an image occurred around that location in the Word document.

${quizPrompt}
          `,
        },
      ];

      images.forEach((image, index) => {
        contents.push({
          text: `Embedded DOCX image ${index + 1} of ${images.length}:`,
        });

        contents.push({
          inlineData: {
            mimeType: image.mimeType,
            data: image.data,
          },
        });
      });

      console.log(
        `StudyMate extracted ${images.length} supported image(s) from DOCX.`,
      );
    }

    const { response, model } = await generateWithFallback(contents);

    if (!response.text) {
      return NextResponse.json(
        {
          error: "StudyMate could not generate a quiz from these notes.",
        },
        {
          status: 422,
        },
      );
    }

    let quiz: QuizResponse;

    try {
      quiz = JSON.parse(response.text) as QuizResponse;
    } catch {
      console.error("StudyMate received invalid quiz JSON.");

      return NextResponse.json(
        {
          error: "StudyMate generated an invalid quiz. Please try again.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      !quiz.questions ||
      !Array.isArray(quiz.questions) ||
      quiz.questions.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "StudyMate could not create enough questions from these notes.",
        },
        {
          status: 422,
        },
      );
    }

    const validQuestions = quiz.questions.filter(
      (question) =>
        typeof question.question === "string" &&
        question.question.trim().length > 0 &&
        Array.isArray(question.options) &&
        question.options.length === 4 &&
        question.options.every(
          (option) => typeof option === "string" && option.trim().length > 0,
        ) &&
        Number.isInteger(question.correctAnswer) &&
        question.correctAnswer >= 0 &&
        question.correctAnswer <= 3 &&
        typeof question.explanation === "string" &&
        question.explanation.trim().length > 0 &&
        typeof question.topic === "string" &&
        question.topic.trim().length > 0,
    );

    if (validQuestions.length === 0) {
      return NextResponse.json(
        {
          error:
            "StudyMate could not create valid quiz questions from these notes.",
        },
        {
          status: 422,
        },
      );
    }

    const finalQuiz: QuizResponse = {
      title: quiz.title?.trim() || "Your StudyMate Quiz",

      questions: validQuestions.map((question, index) => ({
        ...question,
        id: index + 1,
      })),
    };

    return NextResponse.json({
      success: true,
      fileName: file.name,
      difficulty,
      requestedQuestionCount: questionCount,
      generatedQuestionCount: finalQuiz.questions.length,
      quiz: finalQuiz,
      modelUsed: model,
    });
  } catch (error) {
    console.error("StudyMate quiz generation error:", error);

    const status = getErrorStatus(error);

    if (status === 429) {
      return NextResponse.json(
        {
          error:
            "StudyMate has temporarily reached its AI usage limit. Please try again shortly.",
        },
        {
          status: 429,
        },
      );
    }

    if (status === 500 || status === 502 || status === 503 || status === 504) {
      return NextResponse.json(
        {
          error:
            "StudyMate's AI is temporarily busy. Please try again in a moment.",
        },
        {
          status: 503,
        },
      );
    }

    return NextResponse.json(
      {
        error: "StudyMate could not create your quiz. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}
