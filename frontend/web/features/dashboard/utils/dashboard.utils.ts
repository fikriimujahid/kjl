import type { DashboardProductProgress } from '../types/dashboard.types';

export function getTodayIndex(date: Date = new Date()) {
  return date.getDay();
}

export function getActivityCellState(
  weekIndex: number,
  dayIndex: number,
  todayIndex: number,
  totalWeeks: number,
) {
  const isCurrentWeek = weekIndex === totalWeeks - 1;

  return {
    isToday: isCurrentWeek && dayIndex === todayIndex,
    isFuture: isCurrentWeek && dayIndex > todayIndex,
  };
}

export function getDashboardProductProgress(
  productId: string,
  productProgress: DashboardProductProgress,
) {
  return productProgress[productId] ?? 0;
}