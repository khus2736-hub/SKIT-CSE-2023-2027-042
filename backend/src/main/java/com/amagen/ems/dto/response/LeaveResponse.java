package com.amagen.ems.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record LeaveResponse(
    String id,
    String employeeId,
    String employeeCode,
    String employeeName,
    String leaveType,
    LocalDate startDate,
    LocalDate endDate,
    int days,
    String reason,
    String status,
    String adminRemarks,
    String reviewedBy,
    String reviewerName,
    LocalDateTime reviewedAt,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
