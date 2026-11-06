package com.amagen.ems.controller;

import com.amagen.ems.dto.request.TaskRequest;
import com.amagen.ems.dto.request.TaskStatusRequest;
import com.amagen.ems.dto.response.PageResponse;
import com.amagen.ems.dto.response.TaskResponse;
import com.amagen.ems.model.enums.TaskPriority;
import com.amagen.ems.model.enums.TaskStatus;
import com.amagen.ems.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskRequest request) {
        TaskResponse response = taskService.createTask(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable String id,
            @Valid @RequestBody TaskRequest request
    ) {
        return ResponseEntity.ok(taskService.updateTask(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTask(@PathVariable String id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponse<TaskResponse>> getTasksAdmin(
            @RequestParam(required = false) String assignedTo,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean overdue,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(taskService.getTasksAdmin(assignedTo, status, priority, search, overdue, pageable));
    }

    @GetMapping("/my")
    public ResponseEntity<PageResponse<TaskResponse>> getMyTasks(
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @PageableDefault(size = 10, sort = "dueDate", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(taskService.getMyTasks(status, priority, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTaskById(@PathVariable String id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponse> updateTaskStatus(
            @PathVariable String id,
            @Valid @RequestBody TaskStatusRequest request
    ) {
        return ResponseEntity.ok(taskService.updateTaskStatus(id, request));
    }
}
