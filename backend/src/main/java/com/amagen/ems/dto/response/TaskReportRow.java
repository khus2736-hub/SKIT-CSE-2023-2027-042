package com.amagen.ems.dto.response;

public record TaskReportRow(
    String employeeId,
    String employeeCode,
    String employeeName,
    String departmentName,
    long total,
    long pending,
    long inProgress,
    long completed,
    long overdue
) {}
