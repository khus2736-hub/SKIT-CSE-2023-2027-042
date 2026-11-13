package com.amagen.ems.dto.response;

public record LeaveReportRow(
    String employeeId,
    String employeeCode,
    String employeeName,
    String departmentName,
    long totalRequests,
    long pending,
    long approved,
    long rejected,
    long cancelled,
    long approvedDays
) {}
