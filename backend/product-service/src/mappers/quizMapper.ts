import { SessionDetail } from "../models/product";
import { QuizQuestionRecord } from "../types/productServiceTypes";

export const mapQuizQuestionToSessionDetail = (
  question: QuizQuestionRecord
): SessionDetail => {
  return {
    id: question.id,
    text: question.text,
    options: question.options.map((option) => option.text),
    image: question.image,
    audio: question.audio
  };
};
