package com.amagen.ems.service;

import com.amagen.ems.dto.response.*;
import com.amagen.ems.exception.BadRequestException;
import com.amagen.ems.model.*;
import com.amagen.ems.model.enums.AttendanceStatus;
import com.amagen.ems.model.enums.EmployeeStatus;
import com.amagen.ems.model.enums.LeaveStatus;
import com.amagen.ems.model.enums.TaskStatus;
import com.amagen.ems.repository.*;
import com.amagen.ems.util.ResponseMapper;
import com.amagen.ems.util.TimeProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final ResponseMapper responseMapper;
    private final TimeProvider timeProvider;
    private final MongoTemplate mongoTemplate;

    public List<EmployeeResponse> getEmployeeReport(String departmentId, EmployeeStatus status) {
        Query query = new Query();
        if (departmentId != null && !departmentId.isBlank()) {
            query.addCriteria(Criteria.where("departmentId").is(departmentId.trim()));
        }
        if (status != null) {
            query.addCriteria(Criteria.where("status").is(status));
        }

        List<Employee> employees = mongoTemplate.find(query, Employee.class);
        return responseMapper.toEmployeeResponses(employees);
    }

    public List<AttendanceReportRow> getAttendanceReport(LocalDate from, LocalDate to, String departmentId) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("From date cannot be after to date");
        }

        // Get employees in scope
        List<Employee> employees = getEmployeesInScope(departmentId);
        if (employees.isEmpty()) return Collections.emptyList();

        Map<String, String> deptMap = departmentRepository.findAll().stream()
                .collect(Collectors.toMap(Department::getId, Department::getName));

        List<String> employeeIds = employees.stream().map(Employee::getId).toList();

        Query query = new Query(Criteria.where("employeeId").in(employeeIds));
        if (from != null && to != null) {
            query.addCriteria(Criteria.where("date").gte(from).lte(to));
        } else if (from != null) {
            query.addCriteria(Criteria.where("date").gte(from));
        } else if (to != null) {
            query.addCriteria(Criteria.where("date").lte(to));
        }

        List<Attendance> attendances = mongoTemplate.find(query, Attendance.class);
        Map<String, List<Attendance>> attByEmp = attendances.stream()
                .collect(Collectors.groupingBy(Attendance::getEmployeeId));

        return employees.stream().map(emp -> {
            List<Attendance> empAtt = attByEmp.getOrDefault(emp.getId(), Collections.emptyList());
            long presentDays = empAtt.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count();
            long halfDays = empAtt.stream().filter(a -> a.getStatus() == AttendanceStatus.HALF_DAY).count();
            long lateDays = empAtt.stream().filter(Attendance::isLate).count();
            double totalHours = empAtt.stream()
                    .mapToDouble(a -> a.getWorkHours() != null ? a.getWorkHours() : 0.0)
                    .sum();
            totalHours = Math.round(totalHours * 100.0) / 100.0;

            String deptName = emp.getDepartmentId() != null ? deptMap.getOrDefault(emp.getDepartmentId(), null) : null;

            return new AttendanceReportRow(
                    emp.getId(),
                    emp.getEmployeeCode(),
                    emp.getFirstName() + " " + emp.getLastName(),
                    deptName,
                    presentDays,
                    halfDays,
                    lateDays,
                    totalHours
            );
        }).toList();
    }

    public List<LeaveReportRow> getLeaveReport(LocalDate from, LocalDate to, String departmentId) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("From date cannot be after to date");
        }

        List<Employee> employees = getEmployeesInScope(departmentId);
        if (employees.isEmpty()) return Collections.emptyList();

        Map<String, String> deptMap = departmentRepository.findAll().stream()
                .collect(Collectors.toMap(Department::getId, Department::getName));

        List<String> employeeIds = employees.stream().map(Employee::getId).toList();

        Query query = new Query(Criteria.where("employeeId").in(employeeIds));
        if (from != null && to != null) {
            query.addCriteria(Criteria.where("startDate").lte(to).and("endDate").gte(from));
        } else if (from != null) {
            query.addCriteria(Criteria.where("endDate").gte(from));
        } else if (to != null) {
            query.addCriteria(Criteria.where("startDate").lte(to));
        }

        List<LeaveRequest> leaves = mongoTemplate.find(query, LeaveRequest.class);
        Map<String, List<LeaveRequest>> leavesByEmp = leaves.stream()
                .collect(Collectors.groupingBy(LeaveRequest::getEmployeeId));

        return employees.stream().map(emp -> {
            List<LeaveRequest> empLeaves = leavesByEmp.getOrDefault(emp.getId(), Collections.emptyList());
            long totalRequests = empLeaves.size();
            long pending = empLeaves.stream().filter(l -> l.getStatus() == LeaveStatus.PENDING).count();
            long approved = empLeaves.stream().filter(l -> l.getStatus() == LeaveStatus.APPROVED).count();
            long rejected = empLeaves.stream().filter(l -> l.getStatus() == LeaveStatus.REJECTED).count();
            long cancelled = empLeaves.stream().filter(l -> l.getStatus() == LeaveStatus.CANCELLED).count();
            long approvedDays = empLeaves.stream()
                    .filter(l -> l.getStatus() == LeaveStatus.APPROVED)
                    .mapToLong(LeaveRequest::getDays)
                    .sum();

            String deptName = emp.getDepartmentId() != null ? deptMap.getOrDefault(emp.getDepartmentId(), null) : null;

            return new LeaveReportRow(
                    emp.getId(),
                    emp.getEmployeeCode(),
                    emp.getFirstName() + " " + emp.getLastName(),
                    deptName,
                    totalRequests,
                    pending,
                    approved,
                    rejected,
                    cancelled,
                    approvedDays
            );
        }).toList();
    }

    public List<TaskReportRow> getTaskReport(LocalDate from, LocalDate to, String departmentId) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("From date cannot be after to date");
        }

        List<Employee> employees = getEmployeesInScope(departmentId);
        if (employees.isEmpty()) return Collections.emptyList();

        Map<String, String> deptMap = departmentRepository.findAll().stream()
                .collect(Collectors.toMap(Department::getId, Department::getName));

        List<String> employeeIds = employees.stream().map(Employee::getId).toList();

        Query query = new Query(Criteria.where("assignedTo").in(employeeIds));
        if (from != null && to != null) {
            query.addCriteria(Criteria.where("dueDate").gte(from).lte(to));
        } else if (from != null) {
            query.addCriteria(Criteria.where("dueDate").gte(from));
        } else if (to != null) {
            query.addCriteria(Criteria.where("dueDate").lte(to));
        }

        List<Task> tasks = mongoTemplate.find(query, Task.class);
        Map<String, List<Task>> tasksByEmp = tasks.stream()
                .collect(Collectors.groupingBy(Task::getAssignedTo));

        LocalDate today = timeProvider.today();

        return employees.stream().map(emp -> {
            List<Task> empTasks = tasksByEmp.getOrDefault(emp.getId(), Collections.emptyList());
            long total = empTasks.size();
            long pending = empTasks.stream().filter(t -> t.getStatus() == TaskStatus.PENDING).count();
            long inProgress = empTasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
            long completed = empTasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();
            long overdue = empTasks.stream()
                    .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(today) && t.getStatus() != TaskStatus.COMPLETED)
                    .count();

            String deptName = emp.getDepartmentId() != null ? deptMap.getOrDefault(emp.getDepartmentId(), null) : null;

            return new TaskReportRow(
                    emp.getId(),
                    emp.getEmployeeCode(),
                    emp.getFirstName() + " " + emp.getLastName(),
                    deptName,
                    total,
                    pending,
                    inProgress,
                    completed,
                    overdue
            );
        }).toList();
    }

    private List<Employee> getEmployeesInScope(String departmentId) {
        if (departmentId != null && !departmentId.isBlank()) {
            return employeeRepository.findByDepartmentId(departmentId.trim());
        }
        return employeeRepository.findAll();
    }
}
