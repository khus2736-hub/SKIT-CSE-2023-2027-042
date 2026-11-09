package com.amagen.ems.dto.response;

import java.util.List;

public record EmployeeDashboardResponse(
    EmployeeResponse employee,
    AttendanceResponse todayAttendance,
    MonthAttendance monthAttendance,
    LeaveSummary leaveSummary,
    TaskStats taskStats,
    List<TaskResponse> upcomingTasks
) {
    public record MonthAttendance(long presentDays, long halfDays, long lateDays, double totalHours) {}
    public record LeaveSummary(long pending, long approved, long rejected, long approvedDaysThisYear) {}
    public record TaskStats(long total, long pending, long inProgress, long completed, long overdue) {}
}
