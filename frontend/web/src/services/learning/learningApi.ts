import { extractSuccessData } from "@/lib/api/response";

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