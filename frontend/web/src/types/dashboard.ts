export interface DashboardActivityWeek {
  label: string;
  values: number[];
}

export type DashboardProductProgress = Record<string, number>;

export interface DashboardWordOfTheDay {
  word: string;
  reading: string;
  meaning: string;
  example: string;
  exampleTl: string;
}