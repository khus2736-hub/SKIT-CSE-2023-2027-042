package com.amagen.ems.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record EmployeeResponse(
    String id,
    String employeeCode,
    String firstName,
    String lastName,
    String email,
    String phone,
    String address,
    String departmentId,
    String departmentName,
    String designationId,
    String designationTitle,
    LocalDate joiningDate,
    String status,
    String userId,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
