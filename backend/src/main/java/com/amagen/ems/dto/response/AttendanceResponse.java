package com.amagen.ems.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AttendanceResponse(
    String id,
    String employeeId,
    String employeeCode,
    String employeeName,
    LocalDate date,
    LocalDateTime checkIn,
    LocalDateTime checkOut,
    Double workHours,
    boolean late,
    String status,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
