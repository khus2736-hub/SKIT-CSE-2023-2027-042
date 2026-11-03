package com.amagen.ems.dto.request;

import com.amagen.ems.model.enums.TaskPriority;
import com.amagen.ems.model.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record TaskRequest(
    @NotBlank(message = "Title is required")
    String title,

    String description,

    @NotBlank(message = "Assignee is required")
    String assignedTo,

    @NotNull(message = "Priority is required")
    TaskPriority priority,

    @NotNull(message = "Due date is required")
    LocalDate dueDate,

    TaskStatus status
) {}
