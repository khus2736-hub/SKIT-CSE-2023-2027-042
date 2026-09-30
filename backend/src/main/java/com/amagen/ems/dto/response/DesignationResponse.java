package com.amagen.ems.dto.response;

import java.time.LocalDateTime;

public record DesignationResponse(
    String id,
    String title,
    String description,
    String departmentId,
    String departmentName,
    boolean active,
    long employeeCount,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
