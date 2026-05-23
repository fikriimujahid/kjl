import { saveUserSessionCheckin } from "../repositories/checkinRepository";
import { updateUserLastCheckinDate } from "../services/cognito";

export interface CheckinInput {
  userId: string;
  productId: string;
  topicId: string;
  sessionId: string;
  accessToken?: string;
}

export interface CheckinResult {
  userId: string;
  productId: string;
  topicId: string;
  sessionId: string;
  activityDate: string;
  checkInAt: string;
}

const toJakartaActivityDate = (date: Date): string => {
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);

  return formatted;
};

export const checkin = async (input: CheckinInput): Promise<CheckinResult> => {
  const now = new Date();
  const timestampIso = now.toISOString();
  const activityDate = toJakartaActivityDate(now);

  const savedCheckin = await saveUserSessionCheckin({
    userId: input.userId,
    productId: input.productId,
    topicId: input.topicId,
    sessionId: input.sessionId,
    activityDate,
    timestampIso
  });

  if (input.accessToken) {
    await updateUserLastCheckinDate(input.accessToken, activityDate);
  }

  return {
    userId: savedCheckin.userId,
    productId: savedCheckin.productId,
    topicId: savedCheckin.topicId,
    sessionId: savedCheckin.sessionId,
    activityDate: savedCheckin.activityDate,
    checkInAt: savedCheckin.checkInAt
  };
};
