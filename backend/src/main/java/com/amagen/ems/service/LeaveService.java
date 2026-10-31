package com.amagen.ems.service;

import com.amagen.ems.dto.request.LeaveRequestDto;
import com.amagen.ems.dto.request.LeaveReviewRequest;
import com.amagen.ems.dto.response.LeaveResponse;
import com.amagen.ems.dto.response.PageResponse;
import com.amagen.ems.exception.BadRequestException;
import com.amagen.ems.exception.ConflictException;
import com.amagen.ems.exception.ForbiddenException;
import com.amagen.ems.exception.ResourceNotFoundException;
import com.amagen.ems.model.LeaveRequest;
import com.amagen.ems.model.enums.LeaveStatus;
import com.amagen.ems.model.enums.LeaveType;
import com.amagen.ems.repository.LeaveRequestRepository;
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
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final ResponseMapper responseMapper;
    private final TimeProvider timeProvider;
    private final MongoTemplate mongoTemplate;

    public LeaveResponse applyLeave(LeaveRequestDto request) {
        String employeeId = SecurityUtils.requireEmployeeId();
        LocalDate today = timeProvider.today();

        if (request.startDate().isAfter(request.endDate())) {
            throw new BadRequestException("Start date cannot be after end date");
        }

        if (request.startDate().isBefore(today)) {
            throw new BadRequestException("Start date cannot be in the past");
        }

        // Check overlapping PENDING or APPROVED leaves
        List<LeaveRequest> existingLeaves = leaveRequestRepository.findByEmployeeIdAndStatusIn(
                employeeId,
                List.of(LeaveStatus.PENDING, LeaveStatus.APPROVED)
        );

        for (LeaveRequest existing : existingLeaves) {
            boolean overlaps = !request.endDate().isBefore(existing.getStartDate()) &&
                               !request.startDate().isAfter(existing.getEndDate());
            if (overlaps) {
                throw new ConflictException("You already have a pending or approved leave request during this date range");
            }
        }

        int days = (int) ChronoUnit.DAYS.between(request.startDate(), request.endDate()) + 1;
        LocalDateTime now = timeProvider.now();

        LeaveRequest leave = LeaveRequest.builder()
                .employeeId(employeeId)
                .leaveType(request.leaveType())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .days(days)
                .reason(request.reason().trim())
                .status(LeaveStatus.PENDING)
                .createdAt(now)
                .updatedAt(now)
                .build();

        LeaveRequest saved = leaveRequestRepository.save(leave);
        return responseMapper.toLeaveResponse(saved);
    }

    public PageResponse<LeaveResponse> getMyLeaves(LeaveStatus status, Pageable pageable) {
        String employeeId = SecurityUtils.requireEmployeeId();

        Query query = new Query(Criteria.where("employeeId").is(employeeId));
        if (status != null) {
            query.addCriteria(Criteria.where("status").is(status));
        }

        long total = mongoTemplate.count(query, LeaveRequest.class);
        query.with(pageable);
        List<LeaveRequest> leaves = mongoTemplate.find(query, LeaveRequest.class);

        List<LeaveResponse> content = responseMapper.toLeaveResponses(leaves);
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

    public LeaveResponse cancelLeave(String id) {
        String employeeId = SecurityUtils.requireEmployeeId();

        LeaveRequest leave = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found with id: " + id));

        if (!leave.getEmployeeId().equals(employeeId)) {
            throw new ForbiddenException("You can only cancel your own leave requests");
        }

        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new BadRequestException("Only PENDING leave requests can be cancelled");
        }

        leave.setStatus(LeaveStatus.CANCELLED);
        leave.setUpdatedAt(timeProvider.now());

        LeaveRequest updated = leaveRequestRepository.save(leave);
        return responseMapper.toLeaveResponse(updated);
    }

    public PageResponse<LeaveResponse> getLeavesAdmin(
            LeaveStatus status,
            String employeeId,
            LeaveType leaveType,
            LocalDate from,
            LocalDate to,
            Pageable pageable
    ) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("From date cannot be after to date");
        }

        Query query = new Query();
        List<Criteria> criteriaList = new ArrayList<>();

        if (status != null) {
            criteriaList.add(Criteria.where("status").is(status));
        }

        if (employeeId != null && !employeeId.isBlank()) {
            criteriaList.add(Criteria.where("employeeId").is(employeeId.trim()));
        }

        if (leaveType != null) {
            criteriaList.add(Criteria.where("leaveType").is(leaveType));
        }

        // Date overlap filter: leave starts on/before 'to' and ends on/after 'from'
        if (from != null && to != null) {
            criteriaList.add(Criteria.where("startDate").lte(to));
            criteriaList.add(Criteria.where("endDate").gte(from));
        } else if (from != null) {
            criteriaList.add(Criteria.where("endDate").gte(from));
        } else if (to != null) {
            criteriaList.add(Criteria.where("startDate").lte(to));
        }

        if (!criteriaList.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteriaList.toArray(new Criteria[0])));
        }

        long total = mongoTemplate.count(query, LeaveRequest.class);
        query.with(pageable);
        List<LeaveRequest> leaves = mongoTemplate.find(query, LeaveRequest.class);

        List<LeaveResponse> content = responseMapper.toLeaveResponses(leaves);
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

    public LeaveResponse reviewLeave(String id, LeaveReviewRequest request) {
        LeaveRequest leave = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found with id: " + id));

        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new BadRequestException("Only PENDING leave requests can be reviewed");
        }

        if (request.status() != LeaveStatus.APPROVED && request.status() != LeaveStatus.REJECTED) {
            throw new BadRequestException("Review status must be either APPROVED or REJECTED");
        }

        if (request.status() == LeaveStatus.REJECTED && (request.remarks() == null || request.remarks().isBlank())) {
            throw new BadRequestException("Remarks are required when rejecting leave");
        }

        // An admin cannot review their own leave
        String currentEmployeeId = SecurityUtils.getCurrentEmployeeId();
        if (currentEmployeeId != null && currentEmployeeId.equals(leave.getEmployeeId())) {
            throw new BadRequestException("You cannot review your own leave request");
        }

        LocalDateTime now = timeProvider.now();
        leave.setStatus(request.status());
        leave.setAdminRemarks(request.remarks() != null ? request.remarks().trim() : null);
        leave.setReviewedBy(SecurityUtils.getCurrentUserId());
        leave.setReviewedAt(now);
        leave.setUpdatedAt(now);

        LeaveRequest updated = leaveRequestRepository.save(leave);
        return responseMapper.toLeaveResponse(updated);
    }
}
