package com.amagen.ems.dto.request;

import com.amagen.ems.model.enums.LeaveStatus;
import jakarta.validation.constraints.NotNull;

public record LeaveReviewRequest(
    @NotNull(message = "Status is required")
    LeaveStatus status,

    String remarks
) {}
