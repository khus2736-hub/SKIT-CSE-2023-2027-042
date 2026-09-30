package com.amagen.ems.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record DepartmentRequest(
    @NotBlank(message = "Department name is required")
    String name,

    @NotBlank(message = "Department code is required")
    @Pattern(regexp = "^[A-Za-z0-9]+$", message = "Department code must be alphanumeric")
    String code,

    String description
) {}
