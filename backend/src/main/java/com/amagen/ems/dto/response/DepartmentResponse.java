package com.amagen.ems.dto.response;

import java.time.LocalDateTime;

public record DepartmentResponse(
    String id,
    String name,
    String code,
    String description,
    boolean active,
    long employeeCount,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
