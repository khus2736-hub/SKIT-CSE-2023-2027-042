package com.amagen.ems.dto.response;

import java.util.List;

public record AdminDashboardResponse(
    long totalEmployees,
    long activeEmployees,
    long inactiveEmployees,
    long totalDepartments,
    long totalDesignations,
    AttendanceTodayStats attendanceToday,
    long pendingLeaves,
    TaskStats taskStats,
    List<DepartmentCount> employeesByDepartment,
    List<AttendanceTrendItem> attendanceTrend,
    List<LeaveResponse> recentLeaveRequests
) {
    public record AttendanceTodayStats(long present, long halfDay, long late, long notMarked) {}
    public record TaskStats(long total, long pending, long inProgress, long completed, long overdue) {}
    public record DepartmentCount(String name, long count) {}
    public record AttendanceTrendItem(String date, long present) {}
}
