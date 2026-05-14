export interface ApiResponseMeta {
  requestId?: string;
  timestamp: string;
}

export interface ApiSuccessEnvelope<TData> {
  success: true;
  data: TData;
  meta: ApiResponseMeta;
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    message: string;
    code?: string;
  };
  meta: ApiResponseMeta;
}
