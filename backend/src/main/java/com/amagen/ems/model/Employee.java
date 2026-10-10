package com.amagen.ems.model;

import com.amagen.ems.model.enums.EmployeeStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document("employees")
public class Employee {

    @Id
    private String id;

    @Indexed(unique = true)
    private String employeeCode;

    private String firstName;

    private String lastName;

    private String departmentId;

    @Indexed(unique = true)
    private String email;

    private String phone;

    private String address;

    private String designationId;

    private LocalDate joiningDate;

    @Builder.Default
    private EmployeeStatus status = EmployeeStatus.ACTIVE;

    private String userId;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
