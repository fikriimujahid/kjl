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

interface FetchLearningSessionAttemptsOptions {
	productId: string;
	topicId: string;
	sessionId: string;
	signal?: AbortSignal;
	cache?: RequestCache;
	accessToken?: string;
}

interface StartLearningSessionAttemptOptions {
	productId: string;
	topicId: string;
	sessionId: string;
	signal?: AbortSignal;
	cache?: RequestCache;
	accessToken?: string;
}

interface FinishLearningSessionAttemptOptions {
	productId: string;
	topicId: string;
	sessionId: string;
	attemptId: string;
	totalQuestions: number;
	correctAnswers: number;
	maxScore: number;
	obtainedScore: number;
	percentage: number;
	passingScore: number;
	passed: boolean;
	durationSeconds?: number;
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

export type LearningAttemptStatus = 'ACTIVE' | 'FINISHED';
export type LearningAttemptSessionType = 'practice' | 'exam';

export interface LearningSessionAttempt {
	attemptId: string;
	attemptNumber: number;
	status: LearningAttemptStatus;
	isActive: boolean;
	startedAt: string;
	finishedAt?: string;
	updatedAt: string;
	totalQuestions?: number;
	correctAnswers?: number;
	maxScore?: number;
	obtainedScore?: number;
	percentage?: number;
	passingScore?: number;
	passed?: boolean;
	durationSeconds?: number;
}

export interface LearningSessionAttemptHistoryResponse {
	productId: string;
	topicId: string;
	sessionId: string;
	sessionType: LearningAttemptSessionType;
	hasActiveAttempt: boolean;
	attempts: LearningSessionAttempt[];
}

export interface StartLearningSessionAttemptResponse extends LearningSessionAttemptHistoryResponse {
	resumed: boolean;
	attempt: LearningSessionAttempt;
}

export interface FinishLearningSessionAttemptResponse extends LearningSessionAttemptHistoryResponse {
	attempt: LearningSessionAttempt;
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

function isLearningAttemptStatus(value: unknown): value is LearningAttemptStatus {
	return value === 'ACTIVE' || value === 'FINISHED';
}

function isLearningAttemptSessionType(value: unknown): value is LearningAttemptSessionType {
	return value === 'practice' || value === 'exam';
}

function isLearningSessionAttempt(value: unknown): value is LearningSessionAttempt {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const candidate = value as Record<string, unknown>;

	if (
		typeof candidate.attemptId !== 'string'
		|| typeof candidate.attemptNumber !== 'number'
		|| !isLearningAttemptStatus(candidate.status)
		|| typeof candidate.isActive !== 'boolean'
		|| typeof candidate.startedAt !== 'string'
		|| typeof candidate.updatedAt !== 'string'
	) {
		return false;
	}

	if (candidate.finishedAt !== undefined && typeof candidate.finishedAt !== 'string') {
		return false;
	}

	const optionalNumberFields = [
		'totalQuestions',
		'correctAnswers',
		'maxScore',
		'obtainedScore',
		'percentage',
		'passingScore',
		'durationSeconds',
	] as const;

	for (const field of optionalNumberFields) {
		if (candidate[field] !== undefined && typeof candidate[field] !== 'number') {
			return false;
		}
	}

	if (candidate.passed !== undefined && typeof candidate.passed !== 'boolean') {
		return false;
	}

	return true;
}

function isLearningSessionAttemptHistoryResponse(value: unknown): value is LearningSessionAttemptHistoryResponse {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const candidate = value as Record<string, unknown>;

	return typeof candidate.productId === 'string'
		&& typeof candidate.topicId === 'string'
		&& typeof candidate.sessionId === 'string'
		&& isLearningAttemptSessionType(candidate.sessionType)
		&& typeof candidate.hasActiveAttempt === 'boolean'
		&& Array.isArray(candidate.attempts)
		&& candidate.attempts.every(isLearningSessionAttempt);
}

function isStartLearningSessionAttemptResponse(value: unknown): value is StartLearningSessionAttemptResponse {
	if (!isLearningSessionAttemptHistoryResponse(value)) {
		return false;
	}

	const candidate = value as unknown as Record<string, unknown>;

	return typeof candidate.resumed === 'boolean'
		&& isLearningSessionAttempt(candidate.attempt);
}

function isFinishLearningSessionAttemptResponse(value: unknown): value is FinishLearningSessionAttemptResponse {
	if (!isLearningSessionAttemptHistoryResponse(value)) {
		return false;
	}

	const candidate = value as unknown as Record<string, unknown>;
	return isLearningSessionAttempt(candidate.attempt);
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

export async function fetchLearningSessionAttempts({
	productId,
	topicId,
	sessionId,
	signal,
	cache = 'no-store',
	accessToken,
}: FetchLearningSessionAttemptsOptions): Promise<LearningSessionAttemptHistoryResponse | null> {
	try {
		const headers: HeadersInit = accessToken
			? { Authorization: `Bearer ${accessToken}` }
			: {};

		const response = await fetch(
			`${LEARNING_API_BASE_URL}/products/${encodeURIComponent(productId)}/topics/${encodeURIComponent(topicId)}/sessions/${encodeURIComponent(sessionId)}/attempts`,
			{
				signal,
				cache,
				headers,
			},
		);

		if (!response.ok) {
			return null;
		}

		const payload: unknown = await response.json();
		const data = extractSuccessData<unknown>(payload);

		if (isLearningSessionAttemptHistoryResponse(data)) {
			return data;
		}

		return null;
	} catch {
		return null;
	}
}

export async function startLearningSessionAttempt({
	productId,
	topicId,
	sessionId,
	signal,
	cache = 'no-store',
	accessToken,
}: StartLearningSessionAttemptOptions): Promise<StartLearningSessionAttemptResponse | null> {
	try {
		const headers: HeadersInit = {
			'content-type': 'application/json',
			...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
		};

		const response = await fetch(
			`${LEARNING_API_BASE_URL}/products/${encodeURIComponent(productId)}/topics/${encodeURIComponent(topicId)}/sessions/${encodeURIComponent(sessionId)}/attempts/start`,
			{
				method: 'POST',
				signal,
				cache,
				headers,
			},
		);

		if (!response.ok) {
			return null;
		}

		const payload: unknown = await response.json();
		const data = extractSuccessData<unknown>(payload);

		if (isStartLearningSessionAttemptResponse(data)) {
			return data;
		}

		return null;
	} catch {
		return null;
	}
}

export async function finishLearningSessionAttempt({
	productId,
	topicId,
	sessionId,
	attemptId,
	totalQuestions,
	correctAnswers,
	maxScore,
	obtainedScore,
	percentage,
	passingScore,
	passed,
	durationSeconds,
	signal,
	cache = 'no-store',
	accessToken,
}: FinishLearningSessionAttemptOptions): Promise<FinishLearningSessionAttemptResponse | null> {
	try {
		const headers: HeadersInit = {
			'content-type': 'application/json',
			...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
		};

		const response = await fetch(
			`${LEARNING_API_BASE_URL}/products/${encodeURIComponent(productId)}/topics/${encodeURIComponent(topicId)}/sessions/${encodeURIComponent(sessionId)}/attempts/${encodeURIComponent(attemptId)}/finish`,
			{
				method: 'POST',
				signal,
				cache,
				headers,
				body: JSON.stringify({
					totalQuestions,
					correctAnswers,
					maxScore,
					obtainedScore,
					percentage,
					passingScore,
					passed,
					durationSeconds,
				}),
			},
		);

		if (!response.ok) {
			return null;
		}

		const payload: unknown = await response.json();
		const data = extractSuccessData<unknown>(payload);

		if (isFinishLearningSessionAttemptResponse(data)) {
			return data;
		}

		return null;
	} catch {
		return null;
	}
}