package com.amagen.ems.model;

import com.amagen.ems.model.enums.LeaveStatus;
import com.amagen.ems.model.enums.LeaveType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document("leave_requests")
public class LeaveRequest {

    @Id
    private String id;

    private String employeeId;

    private LeaveType leaveType;

    private LocalDate startDate;

    private LocalDate endDate;

    private int days;

    private String reason;

    @Builder.Default
    private LeaveStatus status = LeaveStatus.PENDING;

    private String adminRemarks;

    private String reviewedBy;

    private LocalDateTime reviewedAt;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
