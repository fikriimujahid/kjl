import { extractSuccessData } from "@/lib/api/response";
import type { Question } from '@/types/product';

interface FetchLearningSessionImagesOptions {
	productId: string;
	topicId: string;
	sessionId: string;
	signal?: AbortSignal;
	cache?: RequestCache;
	accessToken?: string;
}

interface LearningSessionImagesResponse {
  productId: string;
  topicId: string;
  sessionId: string;
  images: string[];
}

interface FetchLearningSessionQuestionsOptions {
	productId: string;
	topicId: string;
	sessionId: string;
	signal?: AbortSignal;
	cache?: RequestCache;
	accessToken?: string;
}

interface CheckLearningSessionAnswerOptions {
	productId: string;
	topicId: string;
	sessionId: string;
	questionId: string;
	selectedOptionId: string;
	signal?: AbortSignal;
	cache?: RequestCache;
	accessToken?: string;
}

interface LearningQuestionOptionResponse {
	id: string;
	text: string;
}

interface LearningQuestionResponse {
	id: string;
	text: string;
	image?: string;
	audio?: string;
	options: LearningQuestionOptionResponse[];
}

interface LearningSessionQuestionsResponse {
	productId: string;
	topicId: string;
	sessionId: string;
	questions: LearningQuestionResponse[];
}

export interface LearningSessionAnswerCheckResult {
	productId: string;
	topicId: string;
	sessionId: string;
	questionId: string;
	selectedOptionId: string;
	correctAnswer: string;
	isCorrect: boolean;
	score: number;
	awardedScore: number;
	explanation?: string;
}

const LEARNING_API_BASE_URL = (process.env.LEARNING_API_BASE_URL ?? '/api/learning').replace(/\/+$/, '');

function isLearningSessionImagesResponse(value: unknown): value is LearningSessionImagesResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return typeof candidate.productId === 'string'
    && typeof candidate.topicId === 'string'
    && typeof candidate.sessionId === 'string'
    && Array.isArray(candidate.images)
    && candidate.images.every((image) => typeof image === 'string');
}

export async function fetchLearningSessionImages({
	productId,
	topicId,
	sessionId,
	signal,
	cache = 'no-store',
	accessToken,
}: FetchLearningSessionImagesOptions): Promise<string[]> {
	try {
		const headers: HeadersInit = accessToken
			? { Authorization: `Bearer ${accessToken}` }
			: {};

		const response = await fetch(
			`${LEARNING_API_BASE_URL}/products/${encodeURIComponent(productId)}/topics/${encodeURIComponent(topicId)}/sessions/${encodeURIComponent(sessionId)}/images`,
			{
				signal,
				cache,
				headers,
			},
		);

		if (!response.ok) {
			return [];
		}

		const payload: unknown = await response.json();
		const data = extractSuccessData<unknown>(payload);

		if (isLearningSessionImagesResponse(data)) {
			return data.images;
		}

		return [];
	} catch {
		return [];
	}
}

function isLearningQuestionOptionResponse(value: unknown): value is LearningQuestionOptionResponse {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const candidate = value as Record<string, unknown>;

	return typeof candidate.id === 'string' && typeof candidate.text === 'string';
}

function isLearningQuestionResponse(value: unknown): value is LearningQuestionResponse {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const candidate = value as Record<string, unknown>;

	if (typeof candidate.id !== 'string' || typeof candidate.text !== 'string') {
		return false;
	}

	if (candidate.image !== undefined && typeof candidate.image !== 'string') {
		return false;
	}

	if (candidate.audio !== undefined && typeof candidate.audio !== 'string') {
		return false;
	}

	return Array.isArray(candidate.options) && candidate.options.every(isLearningQuestionOptionResponse);
}

function isLearningSessionQuestionsResponse(value: unknown): value is LearningSessionQuestionsResponse {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const candidate = value as Record<string, unknown>;

	return typeof candidate.productId === 'string'
		&& typeof candidate.topicId === 'string'
		&& typeof candidate.sessionId === 'string'
		&& Array.isArray(candidate.questions)
		&& candidate.questions.every(isLearningQuestionResponse);
}

function mapLearningQuestionResponseToQuestion(question: LearningQuestionResponse): Question {
	const optionIds = question.options.map((option, index) => {
		if (option.id.trim().length > 0) {
			return option.id;
		}

		return `opt${String.fromCharCode(65 + index)}`;
	});

	return {
		id: question.id,
		text: question.text,
		image: question.image,
		audio: question.audio,
		options: question.options.map((option) => option.text),
		optionIds,
		correctAnswer: optionIds[0] ?? ''
	};
}

export async function fetchLearningSessionQuestions({
	productId,
	topicId,
	sessionId,
	signal,
	cache = 'no-store',
	accessToken,
}: FetchLearningSessionQuestionsOptions): Promise<Question[]> {
	try {
		const headers: HeadersInit = accessToken
			? { Authorization: `Bearer ${accessToken}` }
			: {};

		const response = await fetch(
			`${LEARNING_API_BASE_URL}/products/${encodeURIComponent(productId)}/topics/${encodeURIComponent(topicId)}/sessions/${encodeURIComponent(sessionId)}/questions`,
			{
				signal,
				cache,
				headers,
			},
		);

		if (!response.ok) {
			return [];
		}

		const payload: unknown = await response.json();
		const data = extractSuccessData<unknown>(payload);

		if (isLearningSessionQuestionsResponse(data)) {
			return data.questions.map(mapLearningQuestionResponseToQuestion);
		}

		return [];
	} catch {
		return [];
	}
}

function isLearningSessionAnswerCheckResult(value: unknown): value is LearningSessionAnswerCheckResult {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const candidate = value as Record<string, unknown>;

	if (
		typeof candidate.productId !== 'string'
		|| typeof candidate.topicId !== 'string'
		|| typeof candidate.sessionId !== 'string'
		|| typeof candidate.questionId !== 'string'
		|| typeof candidate.selectedOptionId !== 'string'
		|| typeof candidate.correctAnswer !== 'string'
		|| typeof candidate.isCorrect !== 'boolean'
		|| typeof candidate.score !== 'number'
		|| typeof candidate.awardedScore !== 'number'
	) {
		return false;
	}

	if (candidate.explanation !== undefined && typeof candidate.explanation !== 'string') {
		return false;
	}

	return true;
}

export async function checkLearningSessionAnswer({
	productId,
	topicId,
	sessionId,
	questionId,
	selectedOptionId,
	signal,
	cache = 'no-store',
	accessToken,
}: CheckLearningSessionAnswerOptions): Promise<LearningSessionAnswerCheckResult | null> {
	try {
		const headers: HeadersInit = {
			'content-type': 'application/json',
			...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
		};

		const response = await fetch(
			`${LEARNING_API_BASE_URL}/products/${encodeURIComponent(productId)}/topics/${encodeURIComponent(topicId)}/sessions/${encodeURIComponent(sessionId)}/answers/check`,
			{
				method: 'POST',
				signal,
				cache,
				headers,
				body: JSON.stringify({
					questionId,
					selectedOptionId,
				}),
			},
		);

		if (!response.ok) {
			return null;
		}

		const payload: unknown = await response.json();
		const data = extractSuccessData<unknown>(payload);

		if (isLearningSessionAnswerCheckResult(data)) {
			return data;
		}

		return null;
	} catch {
		return null;
	}
}