const API_BASE_URL = (process.env.NEXT_API_BASE_URL ?? '/api').replace(/\/$/, '');
const QUIZ_SUBMIT_ENDPOINT = '/quiz/exam/submit';

export interface SubmitQuizAnswer {
  questionId: string;
  selectedOptionId: string;
}

export interface SubmitQuizExamOptions {
  productId: string;
  topicId: string;
  sessionId: string;
  answers: SubmitQuizAnswer[];
  accessToken: string;
}

export interface QuizQuestionResult {
  questionId: string;
  selectedOptionId: string | null;
  correctOptionId: string;
  isCorrect: boolean;
  scoreAwarded: number;
  maxScore: number;
  explanation?: string;
}

export interface SubmitQuizExamResponse {
  submissionId: string;
  submittedAt: string;
  productId: string;
  topicId: string;
  sessionId: string;
  passingScore: number;
  passed: boolean;
  obtainedScore: number;
  maxScore: number;
  percentage: number;
  answeredCount: number;
  totalQuestions: number;
  details: QuizQuestionResult[];
}

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as { message?: unknown };

    if (typeof payload?.message === 'string' && payload.message.length > 0) {
      return payload.message;
    }
  } catch {
    // Ignore response parse errors and fallback to generic message.
  }

  return 'Failed to submit quiz exam';
};

export async function submitQuizExam({
  productId,
  topicId,
  sessionId,
  answers,
  accessToken,
}: SubmitQuizExamOptions): Promise<SubmitQuizExamResponse> {
  const response = await fetch(`${API_BASE_URL}${QUIZ_SUBMIT_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      productId,
      topicId,
      sessionId,
      answers,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<SubmitQuizExamResponse>;
}
