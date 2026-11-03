package com.amagen.ems.repository;

import com.amagen.ems.model.Task;
import com.amagen.ems.model.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends MongoRepository<Task, String> {

    Page<Task> findByAssignedTo(String employeeId, Pageable pageable);

    List<Task> findByAssignedTo(String employeeId);

    long countByStatus(TaskStatus status);

    long countByAssignedToAndStatus(String employeeId, TaskStatus status);

    long countByAssignedTo(String employeeId);
}
