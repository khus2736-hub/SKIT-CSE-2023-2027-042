package com.amagen.ems.service;

import com.amagen.ems.dto.response.AttendanceResponse;
import com.amagen.ems.dto.response.PageResponse;
import com.amagen.ems.exception.BadRequestException;
import com.amagen.ems.exception.ConflictException;
import com.amagen.ems.exception.ForbiddenException;
import com.amagen.ems.model.Attendance;
import com.amagen.ems.model.Employee;
import com.amagen.ems.model.enums.AttendanceStatus;
import com.amagen.ems.model.enums.EmployeeStatus;
import com.amagen.ems.repository.AttendanceRepository;
import com.amagen.ems.repository.EmployeeRepository;
import com.amagen.ems.security.SecurityUtils;
import com.amagen.ems.util.ResponseMapper;
import com.amagen.ems.util.TimeProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final ResponseMapper responseMapper;
    private final TimeProvider timeProvider;
    private final MongoTemplate mongoTemplate;

    @Value("${app.attendance.late-after:10:00}")
    private String lateAfterTimeStr;

    @Value("${app.attendance.half-day-hours:4}")
    private double halfDayHours;

    public AttendanceResponse checkIn() {
        String employeeId = SecurityUtils.requireEmployeeId();
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ForbiddenException("Employee record not found"));

        if (employee.getStatus() != EmployeeStatus.ACTIVE) {
            throw new ForbiddenException("Inactive employees cannot mark attendance");
        }

        LocalDate today = timeProvider.today();
        LocalDateTime now = timeProvider.now();

        if (attendanceRepository.findByEmployeeIdAndDate(employeeId, today).isPresent()) {
            throw new ConflictException("Already checked in today");
        }

        LocalTime lateThreshold = LocalTime.parse(lateAfterTimeStr, DateTimeFormatter.ofPattern("HH:mm"));
        boolean late = now.toLocalTime().isAfter(lateThreshold);

        Attendance attendance = Attendance.builder()
                .employeeId(employeeId)
                .date(today)
                .checkIn(now)
                .late(late)
                .status(AttendanceStatus.PRESENT)
                .createdAt(now)
                .updatedAt(now)
                .build();

        try {
            Attendance saved = attendanceRepository.save(attendance);
            return responseMapper.toAttendanceResponse(saved);
        } catch (DuplicateKeyException e) {
            throw new ConflictException("Already checked in today");
        }
    }

    public AttendanceResponse checkOut() {
        String employeeId = SecurityUtils.requireEmployeeId();
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ForbiddenException("Employee record not found"));

        if (employee.getStatus() != EmployeeStatus.ACTIVE) {
            throw new ForbiddenException("Inactive employees cannot mark attendance");
        }

        LocalDate today = timeProvider.today();
        LocalDateTime now = timeProvider.now();

        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(employeeId, today)
                .orElseThrow(() -> new BadRequestException("You have not checked in today"));

        if (attendance.getCheckOut() != null) {
            throw new ConflictException("Already checked out today");
        }

        attendance.setCheckOut(now);
        Duration duration = Duration.between(attendance.getCheckIn(), now);
        double hours = duration.toSeconds() / 3600.0;
        double workHours = Math.round(hours * 100.0) / 100.0;

        attendance.setWorkHours(workHours);
        if (workHours < halfDayHours) {
            attendance.setStatus(AttendanceStatus.HALF_DAY);
        } else {
            attendance.setStatus(AttendanceStatus.PRESENT);
        }
        attendance.setUpdatedAt(now);

        Attendance updated = attendanceRepository.save(attendance);
        return responseMapper.toAttendanceResponse(updated);
    }

    public AttendanceResponse getToday() {
        String employeeId = SecurityUtils.requireEmployeeId();
        LocalDate today = timeProvider.today();
        return attendanceRepository.findByEmployeeIdAndDate(employeeId, today)
                .map(responseMapper::toAttendanceResponse)
                .orElse(null);
    }

    public PageResponse<AttendanceResponse> getMyAttendance(LocalDate from, LocalDate to, Pageable pageable) {
        String employeeId = SecurityUtils.requireEmployeeId();

        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("From date cannot be after to date");
        }

        Query query = new Query(Criteria.where("employeeId").is(employeeId));

        if (from != null && to != null) {
            query.addCriteria(Criteria.where("date").gte(from).lte(to));
        } else if (from != null) {
            query.addCriteria(Criteria.where("date").gte(from));
        } else if (to != null) {
            query.addCriteria(Criteria.where("date").lte(to));
        }

        long total = mongoTemplate.count(query, Attendance.class);
        query.with(pageable);
        List<Attendance> attendances = mongoTemplate.find(query, Attendance.class);

        List<AttendanceResponse> content = responseMapper.toAttendanceResponses(attendances);
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

    public PageResponse<AttendanceResponse> getAttendanceAdmin(
            String employeeId,
            String departmentId,
            LocalDate from,
            LocalDate to,
            AttendanceStatus status,
            Pageable pageable
    ) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("From date cannot be after to date");
        }

        Query query = new Query();
        List<Criteria> criteriaList = new ArrayList<>();

        if (employeeId != null && !employeeId.isBlank()) {
            criteriaList.add(Criteria.where("employeeId").is(employeeId.trim()));
        } else if (departmentId != null && !departmentId.isBlank()) {
            List<Employee> deptEmployees = employeeRepository.findByDepartmentId(departmentId.trim());
            List<String> empIds = deptEmployees.stream().map(Employee::getId).toList();
            criteriaList.add(Criteria.where("employeeId").in(empIds));
        }

        if (status != null) {
            criteriaList.add(Criteria.where("status").is(status));
        }

        if (from != null && to != null) {
            criteriaList.add(Criteria.where("date").gte(from).lte(to));
        } else if (from != null) {
            criteriaList.add(Criteria.where("date").gte(from));
        } else if (to != null) {
            criteriaList.add(Criteria.where("date").lte(to));
        }

        if (!criteriaList.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteriaList.toArray(new Criteria[0])));
        }

        long total = mongoTemplate.count(query, Attendance.class);
        query.with(pageable);
        List<Attendance> attendances = mongoTemplate.find(query, Attendance.class);

        List<AttendanceResponse> content = responseMapper.toAttendanceResponses(attendances);
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
