package com.amagen.ems.dto.request;

import jakarta.validation.constraints.NotBlank;

public record DesignationRequest(
    @NotBlank(message = "Designation title is required")
    String title,

    String description,

    String departmentId
) {}
