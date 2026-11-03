package com.amagen.ems.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TaskResponse(
    String id,
    String title,
    String description,
    String assignedTo,
    String assigneeName,
    String assigneeCode,
    String assignedBy,
    String assignerName,
    String priority,
    LocalDate dueDate,
    String status,
    LocalDateTime completedAt,
    boolean overdue,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
