import {
  QuizAnswerKeyRecord,
  QuizScoreSummary,
  SubmitQuizAnswerRecord
} from "../models/quiz";

export const calculateQuizScore = (
  answerKey: QuizAnswerKeyRecord[],
  submittedAnswers: SubmitQuizAnswerRecord[]
): QuizScoreSummary => {
  const submittedAnswerMap = new Map<string, string>();

  for (const answer of submittedAnswers) {
    if (!submittedAnswerMap.has(answer.questionId)) {
      submittedAnswerMap.set(answer.questionId, answer.selectedOptionId);
    }
  }

  const details = answerKey.map((keyItem) => {
    const selectedOptionId = submittedAnswerMap.get(keyItem.id) ?? null;
    const isCorrect = selectedOptionId === keyItem.correctAnswer;
    const maxScore = Math.max(0, keyItem.score);
    const scoreAwarded = isCorrect ? maxScore : 0;

    return {
      questionId: keyItem.id,
      selectedOptionId,
      correctOptionId: keyItem.correctAnswer,
      isCorrect,
      scoreAwarded,
      maxScore,
      explanation: keyItem.explanation
    };
  });

  const maxScore = details.reduce((sum, item) => sum + item.maxScore, 0);
  const obtainedScore = details.reduce((sum, item) => sum + item.scoreAwarded, 0);
  const answeredCount = details.filter((item) => item.selectedOptionId !== null).length;

  const percentage = maxScore > 0
    ? Number(((obtainedScore / maxScore) * 100).toFixed(2))
    : 0;

  return {
    details,
    obtainedScore,
    maxScore,
    percentage,
    answeredCount,
    totalQuestions: details.length
  };
};
