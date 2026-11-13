package com.amagen.ems.dto.response;

public record AttendanceReportRow(
    String employeeId,
    String employeeCode,
    String employeeName,
    String departmentName,
    long presentDays,
    long halfDays,
    long lateDays,
    double totalHours
) {}
