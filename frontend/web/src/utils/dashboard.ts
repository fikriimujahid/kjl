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