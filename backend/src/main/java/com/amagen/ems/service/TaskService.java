package com.amagen.ems.service;

import com.amagen.ems.dto.request.TaskRequest;
import com.amagen.ems.dto.request.TaskStatusRequest;
import com.amagen.ems.dto.response.PageResponse;
import com.amagen.ems.dto.response.TaskResponse;
import com.amagen.ems.exception.BadRequestException;
import com.amagen.ems.exception.ForbiddenException;
import com.amagen.ems.exception.ResourceNotFoundException;
import com.amagen.ems.model.Employee;
import com.amagen.ems.model.Task;
import com.amagen.ems.model.enums.EmployeeStatus;
import com.amagen.ems.model.enums.Role;
import com.amagen.ems.model.enums.TaskPriority;
import com.amagen.ems.model.enums.TaskStatus;
import com.amagen.ems.repository.EmployeeRepository;
import com.amagen.ems.repository.TaskRepository;
import com.amagen.ems.security.SecurityUtils;
import com.amagen.ems.util.ResponseMapper;
import com.amagen.ems.util.TimeProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final EmployeeRepository employeeRepository;
    private final ResponseMapper responseMapper;
    private final TimeProvider timeProvider;
    private final MongoTemplate mongoTemplate;

    public TaskResponse createTask(TaskRequest request) {
        LocalDate today = timeProvider.today();

        if (request.dueDate().isBefore(today)) {
            throw new BadRequestException("Due date cannot be in the past");
        }

        Employee assignee = employeeRepository.findById(request.assignedTo())
                .orElseThrow(() -> new BadRequestException("Assignee employee not found"));

        if (assignee.getStatus() != EmployeeStatus.ACTIVE) {
            throw new BadRequestException("Task cannot be assigned to an inactive employee");
        }

        LocalDateTime now = timeProvider.now();
        TaskStatus status = request.status() != null ? request.status() : TaskStatus.PENDING;
        LocalDateTime completedAt = status == TaskStatus.COMPLETED ? now : null;

        Task task = Task.builder()
                .title(request.title().trim())
                .description(request.description() != null ? request.description().trim() : null)
                .assignedTo(assignee.getId())
                .assignedBy(SecurityUtils.getCurrentUserId())
                .priority(request.priority())
                .dueDate(request.dueDate())
                .status(status)
                .completedAt(completedAt)
                .createdAt(now)
                .updatedAt(now)
                .build();

        Task saved = taskRepository.save(task);
        return responseMapper.toTaskResponse(saved);
    }

    public TaskResponse updateTask(String id, TaskRequest request) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        LocalDate today = timeProvider.today();
        // If due date changed and is before today, reject
        if (!task.getDueDate().equals(request.dueDate()) && request.dueDate().isBefore(today)) {
            throw new BadRequestException("Due date cannot be in the past");
        }

        Employee assignee = employeeRepository.findById(request.assignedTo())
                .orElseThrow(() -> new BadRequestException("Assignee employee not found"));

        if (assignee.getStatus() != EmployeeStatus.ACTIVE) {
            throw new BadRequestException("Task cannot be assigned to an inactive employee");
        }

        LocalDateTime now = timeProvider.now();
        TaskStatus newStatus = request.status() != null ? request.status() : task.getStatus();
        LocalDateTime completedAt = task.getCompletedAt();

        if (newStatus == TaskStatus.COMPLETED && task.getStatus() != TaskStatus.COMPLETED) {
            completedAt = now;
        } else if (newStatus != TaskStatus.COMPLETED) {
            completedAt = null;
        }

        task.setTitle(request.title().trim());
        task.setDescription(request.description() != null ? request.description().trim() : null);
        task.setAssignedTo(assignee.getId());
        task.setPriority(request.priority());
        task.setDueDate(request.dueDate());
        task.setStatus(newStatus);
        task.setCompletedAt(completedAt);
        task.setUpdatedAt(now);

        Task updated = taskRepository.save(task);
        return responseMapper.toTaskResponse(updated);
    }

    public void deleteTask(String id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        taskRepository.delete(task);
    }

    public TaskResponse getTaskById(String id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        // ADMIN or assignee
        if (SecurityUtils.getCurrentUserRole() != Role.ADMIN) {
            String currentEmployeeId = SecurityUtils.getCurrentEmployeeId();
            if (currentEmployeeId == null || !currentEmployeeId.equals(task.getAssignedTo())) {
                throw new ForbiddenException("You are not authorized to view this task");
            }
        }

        return responseMapper.toTaskResponse(task);
    }

    public TaskResponse updateTaskStatus(String id, TaskStatusRequest request) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        // ADMIN or assignee
        if (SecurityUtils.getCurrentUserRole() != Role.ADMIN) {
            String currentEmployeeId = SecurityUtils.getCurrentEmployeeId();
            if (currentEmployeeId == null || !currentEmployeeId.equals(task.getAssignedTo())) {
                throw new ForbiddenException("You can only update the status of tasks assigned to you");
            }
        }

        LocalDateTime now = timeProvider.now();
        TaskStatus newStatus = request.status();

        if (newStatus == TaskStatus.COMPLETED && task.getStatus() != TaskStatus.COMPLETED) {
            task.setCompletedAt(now);
        } else if (newStatus != TaskStatus.COMPLETED) {
            task.setCompletedAt(null);
        }

        task.setStatus(newStatus);
        task.setUpdatedAt(now);

        Task updated = taskRepository.save(task);
        return responseMapper.toTaskResponse(updated);
    }

    public PageResponse<TaskResponse> getMyTasks(TaskStatus status, TaskPriority priority, Pageable pageable) {
        String employeeId = SecurityUtils.requireEmployeeId();

        Query query = new Query(Criteria.where("assignedTo").is(employeeId));

        if (status != null) {
            query.addCriteria(Criteria.where("status").is(status));
        }
        if (priority != null) {
            query.addCriteria(Criteria.where("priority").is(priority));
        }

        long total = mongoTemplate.count(query, Task.class);
        query.with(pageable);
        List<Task> tasks = mongoTemplate.find(query, Task.class);

        List<TaskResponse> content = responseMapper.toTaskResponses(tasks);
        int totalPages = pageable.getPageSize() == 0 ? 1 : (int) Math.ceil((double) total / (double) pageable.getPageSize());
        boolean last = pageable.getOffset() + pageable.getPageSize() >= total;

        return new PageResponse<>(
                content,
                pageable.getPageNumber(),
                pageable.getPageSize(),
                total,
                totalPages,
                last
        );
    }

    public PageResponse<TaskResponse> getTasksAdmin(
            String assignedTo,
            TaskStatus status,
            TaskPriority priority,
            String search,
            Boolean overdue,
            Pageable pageable
    ) {
        Query query = new Query();
        List<Criteria> criteriaList = new ArrayList<>();

        if (assignedTo != null && !assignedTo.isBlank()) {
            criteriaList.add(Criteria.where("assignedTo").is(assignedTo.trim()));
        }

        if (status != null) {
            criteriaList.add(Criteria.where("status").is(status));
        }

        if (priority != null) {
            criteriaList.add(Criteria.where("priority").is(priority));
        }

        if (search != null && !search.isBlank()) {
            String pattern = ".*" + Pattern.quote(search.trim()) + ".*";
            criteriaList.add(new Criteria().orOperator(
                    Criteria.where("title").regex(pattern, "i"),
                    Criteria.where("description").regex(pattern, "i")
            ));
        }

        if (Boolean.TRUE.equals(overdue)) {
            LocalDate today = timeProvider.today();
            criteriaList.add(Criteria.where("dueDate").lt(today));
            criteriaList.add(Criteria.where("status").ne(TaskStatus.COMPLETED));
        }

        if (!criteriaList.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteriaList.toArray(new Criteria[0])));
        }

        long total = mongoTemplate.count(query, Task.class);
        query.with(pageable);
        List<Task> tasks = mongoTemplate.find(query, Task.class);

        List<TaskResponse> content = responseMapper.toTaskResponses(tasks);
        int totalPages = pageable.getPageSize() == 0 ? 1 : (int) Math.ceil((double) total / (double) pageable.getPageSize());
        boolean last = pageable.getOffset() + pageable.getPageSize() >= total;

        return new PageResponse<>(
                content,
                pageable.getPageNumber(),
                pageable.getPageSize(),
                total,
                totalPages,
                last
        );
    }
}
