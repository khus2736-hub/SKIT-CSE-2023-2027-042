package com.amagen.ems.dto.response;

import java.time.LocalDateTime;

public record UserResponse(
    String id,
    String username,
    String role,
    String employeeId,
    boolean enabled,
    String employeeName,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
