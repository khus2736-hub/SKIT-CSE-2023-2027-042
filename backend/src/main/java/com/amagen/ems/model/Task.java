package com.amagen.ems.model;

import com.amagen.ems.model.enums.TaskPriority;
import com.amagen.ems.model.enums.TaskStatus;
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
@Document("tasks")
public class Task {

    @Id
    private String id;

    private String title;

    private String description;

    private String assignedTo;

    private String assignedBy;

    private TaskPriority priority;

    private LocalDate dueDate;

    @Builder.Default
    private TaskStatus status = TaskStatus.PENDING;

    private LocalDateTime completedAt;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
