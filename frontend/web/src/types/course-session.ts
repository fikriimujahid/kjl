import type { Question, Session } from './product';

export type ActiveSessionContentKind = 'images' | 'questions' | 'none';

export interface ActiveSessionContent {
  kind: ActiveSessionContentKind;
  imagePages: string[];
  questions: Question[];
}

export type ActiveCourseSession = Session & {
  content: ActiveSessionContent;
};
