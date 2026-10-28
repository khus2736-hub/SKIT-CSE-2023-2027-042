package com.amagen.ems.repository;

import com.amagen.ems.model.LeaveRequest;
import com.amagen.ems.model.enums.LeaveStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveRequestRepository extends MongoRepository<LeaveRequest, String> {

    Page<LeaveRequest> findByEmployeeId(String employeeId, Pageable pageable);

    Page<LeaveRequest> findByEmployeeIdAndStatus(String employeeId, LeaveStatus status, Pageable pageable);

    List<LeaveRequest> findByEmployeeIdAndStatusIn(String employeeId, List<LeaveStatus> statuses);

    long countByEmployeeIdAndStatus(String employeeId, LeaveStatus status);

    List<LeaveRequest> findByStatusOrderByCreatedAtDesc(LeaveStatus status);
}
