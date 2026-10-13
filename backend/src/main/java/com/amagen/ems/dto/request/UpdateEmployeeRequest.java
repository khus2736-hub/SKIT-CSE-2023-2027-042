package com.amagen.ems.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public record UpdateEmployeeRequest(
    @NotBlank(message = "First name is required")
    String firstName,

    @NotBlank(message = "Last name is required")
    String lastName,

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a well-formed email address")
    String email,

    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^\\d{10}$", message = "Phone must be a 10-digit number")
    String phone,

    String address,

    @NotBlank(message = "Department is required")
    String departmentId,

    @NotBlank(message = "Designation is required")
    String designationId,

    @NotNull(message = "Joining date is required")
    LocalDate joiningDate
) {}
