package com.amagen.ems.util;

import com.amagen.ems.dto.response.*;
import com.amagen.ems.model.*;
import com.amagen.ems.model.enums.TaskStatus;
import com.amagen.ems.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ResponseMapper {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final DesignationRepository designationRepository;
    private final TimeProvider timeProvider;

    // --- User ---
    public UserResponse toUserResponse(User user) {
        if (user == null) return null;
        String employeeName = null;
        if (user.getEmployeeId() != null) {
            Employee emp = employeeRepository.findById(user.getEmployeeId()).orElse(null);
            if (emp != null) {
                employeeName = emp.getFirstName() + " " + emp.getLastName();
            }
        }
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getRole().name(),
                user.getEmployeeId(),
                user.isEnabled(),
                employeeName,
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    public List<UserResponse> toUserResponses(List<User> users) {
        if (users == null || users.isEmpty()) return Collections.emptyList();

        Set<String> empIds = users.stream()
                .map(User::getEmployeeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<String, Employee> empMap = employeeRepository.findAllById(empIds).stream()
                .collect(Collectors.toMap(Employee::getId, Function.identity()));

        return users.stream().map(user -> {
            String employeeName = null;
            if (user.getEmployeeId() != null && empMap.containsKey(user.getEmployeeId())) {
                Employee emp = empMap.get(user.getEmployeeId());
                employeeName = emp.getFirstName() + " " + emp.getLastName();
            }
            return new UserResponse(
                    user.getId(),
                    user.getUsername(),
                    user.getRole().name(),
                    user.getEmployeeId(),
                    user.isEnabled(),
                    employeeName,
                    user.getCreatedAt(),
                    user.getUpdatedAt()
            );
        }).toList();
    }

    // --- Department ---
    public DepartmentResponse toDepartmentResponse(Department dept) {
        if (dept == null) return null;
        long count = employeeRepository.countByDepartmentIdAndStatus(dept.getId(), com.amagen.ems.model.enums.EmployeeStatus.ACTIVE);
        return new DepartmentResponse(
                dept.getId(),
                dept.getName(),
                dept.getCode(),
                dept.getDescription(),
                dept.isActive(),
                count,
                dept.getCreatedAt(),
                dept.getUpdatedAt()
        );
    }

    public List<DepartmentResponse> toDepartmentResponses(List<Department> depts) {
        if (depts == null || depts.isEmpty()) return Collections.emptyList();

        Map<String, Long> countMap = employeeRepository.countEmployeesByDepartment().stream()
                .filter(c -> c.getId() != null)
                .collect(Collectors.toMap(DepartmentEmployeeCount::getId, DepartmentEmployeeCount::getCount));

        return depts.stream().map(dept -> new DepartmentResponse(
                dept.getId(),
                dept.getName(),
                dept.getCode(),
                dept.getDescription(),
                dept.isActive(),
                countMap.getOrDefault(dept.getId(), 0L),
                dept.getCreatedAt(),
                dept.getUpdatedAt()
        )).toList();
    }

    // --- Designation ---
    public DesignationResponse toDesignationResponse(Designation desig) {
        if (desig == null) return null;
        String deptName = null;
        if (desig.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(desig.getDepartmentId()).orElse(null);
            if (dept != null) deptName = dept.getName();
        }
        long count = employeeRepository.countByDesignationId(desig.getId());
        return new DesignationResponse(
                desig.getId(),
                desig.getTitle(),
                desig.getDescription(),
                desig.getDepartmentId(),
                deptName,
                desig.isActive(),
                count,
                desig.getCreatedAt(),
                desig.getUpdatedAt()
        );
    }

    public List<DesignationResponse> toDesignationResponses(List<Designation> desigs) {
        if (desigs == null || desigs.isEmpty()) return Collections.emptyList();

        Set<String> deptIds = desigs.stream()
                .map(Designation::getDepartmentId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<String, Department> deptMap = departmentRepository.findAllById(deptIds).stream()
                .collect(Collectors.toMap(Department::getId, Function.identity()));

        Map<String, Long> countMap = employeeRepository.countEmployeesByDesignation().stream()
                .filter(c -> c.getId() != null)
                .collect(Collectors.toMap(DepartmentEmployeeCount::getId, DepartmentEmployeeCount::getCount));

        return desigs.stream().map(desig -> {
            String deptName = null;
            if (desig.getDepartmentId() != null && deptMap.containsKey(desig.getDepartmentId())) {
                deptName = deptMap.get(desig.getDepartmentId()).getName();
            }
            return new DesignationResponse(
                    desig.getId(),
                    desig.getTitle(),
                    desig.getDescription(),
                    desig.getDepartmentId(),
                    deptName,
                    desig.isActive(),
                    countMap.getOrDefault(desig.getId(), 0L),
                    desig.getCreatedAt(),
                    desig.getUpdatedAt()
            );
        }).toList();
    }

    // --- Employee ---
    public EmployeeResponse toEmployeeResponse(Employee emp) {
        if (emp == null) return null;
        String deptName = null;
        if (emp.getDepartmentId() != null) {
            deptName = departmentRepository.findById(emp.getDepartmentId()).map(Department::getName).orElse(null);
        }
        String desigTitle = null;
        if (emp.getDesignationId() != null) {
            desigTitle = designationRepository.findById(emp.getDesignationId()).map(Designation::getTitle).orElse(null);
        }
        return new EmployeeResponse(
                emp.getId(),
                emp.getEmployeeCode(),
                emp.getFirstName(),
                emp.getLastName(),
                emp.getEmail(),
                emp.getPhone(),
                emp.getAddress(),
                emp.getDepartmentId(),
                deptName,
                emp.getDesignationId(),
                desigTitle,
                emp.getJoiningDate(),
                emp.getStatus() != null ? emp.getStatus().name() : null,
                emp.getUserId(),
                emp.getCreatedAt(),
                emp.getUpdatedAt()
        );
    }

    public List<EmployeeResponse> toEmployeeResponses(List<Employee> employees) {
        if (employees == null || employees.isEmpty()) return Collections.emptyList();

        Set<String> deptIds = employees.stream()
                .map(Employee::getDepartmentId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<String> desigIds = employees.stream()
                .map(Employee::getDesignationId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<String, Department> deptMap = departmentRepository.findAllById(deptIds).stream()
                .collect(Collectors.toMap(Department::getId, Function.identity()));

        Map<String, Designation> desigMap = designationRepository.findAllById(desigIds).stream()
                .collect(Collectors.toMap(Designation::getId, Function.identity()));

        return employees.stream().map(emp -> {
            String deptName = (emp.getDepartmentId() != null && deptMap.containsKey(emp.getDepartmentId()))
                    ? deptMap.get(emp.getDepartmentId()).getName() : null;
            String desigTitle = (emp.getDesignationId() != null && desigMap.containsKey(emp.getDesignationId()))
                    ? desigMap.get(emp.getDesignationId()).getTitle() : null;

            return new EmployeeResponse(
                    emp.getId(),
                    emp.getEmployeeCode(),
                    emp.getFirstName(),
                    emp.getLastName(),
                    emp.getEmail(),
                    emp.getPhone(),
                    emp.getAddress(),
                    emp.getDepartmentId(),
                    deptName,
                    emp.getDesignationId(),
                    desigTitle,
                    emp.getJoiningDate(),
                    emp.getStatus() != null ? emp.getStatus().name() : null,
                    emp.getUserId(),
                    emp.getCreatedAt(),
                    emp.getUpdatedAt()
            );
        }).toList();
    }

    // --- Attendance ---
    public AttendanceResponse toAttendanceResponse(Attendance att) {
        if (att == null) return null;
        String empCode = null;
        String empName = null;
        if (att.getEmployeeId() != null) {
            Employee emp = employeeRepository.findById(att.getEmployeeId()).orElse(null);
            if (emp != null) {
                empCode = emp.getEmployeeCode();
                empName = emp.getFirstName() + " " + emp.getLastName();
            }
        }
        return new AttendanceResponse(
                att.getId(),
                att.getEmployeeId(),
                empCode,
                empName,
                att.getDate(),
                att.getCheckIn(),
                att.getCheckOut(),
                att.getWorkHours(),
                att.isLate(),
                att.getStatus() != null ? att.getStatus().name() : null,
                att.getCreatedAt(),
                att.getUpdatedAt()
        );
    }

    public List<AttendanceResponse> toAttendanceResponses(List<Attendance> attendances) {
        if (attendances == null || attendances.isEmpty()) return Collections.emptyList();

        Set<String> empIds = attendances.stream()
                .map(Attendance::getEmployeeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<String, Employee> empMap = employeeRepository.findAllById(empIds).stream()
                .collect(Collectors.toMap(Employee::getId, Function.identity()));

        return attendances.stream().map(att -> {
            String empCode = null;
            String empName = null;
            if (att.getEmployeeId() != null && empMap.containsKey(att.getEmployeeId())) {
                Employee emp = empMap.get(att.getEmployeeId());
                empCode = emp.getEmployeeCode();
                empName = emp.getFirstName() + " " + emp.getLastName();
            }
            return new AttendanceResponse(
                    att.getId(),
                    att.getEmployeeId(),
                    empCode,
                    empName,
                    att.getDate(),
                    att.getCheckIn(),
                    att.getCheckOut(),
                    att.getWorkHours(),
                    att.isLate(),
                    att.getStatus() != null ? att.getStatus().name() : null,
                    att.getCreatedAt(),
                    att.getUpdatedAt()
            );
        }).toList();
    }

    // --- Leave ---
    public LeaveResponse toLeaveResponse(LeaveRequest leave) {
        if (leave == null) return null;
        String empCode = null;
        String empName = null;
        if (leave.getEmployeeId() != null) {
            Employee emp = employeeRepository.findById(leave.getEmployeeId()).orElse(null);
            if (emp != null) {
                empCode = emp.getEmployeeCode();
                empName = emp.getFirstName() + " " + emp.getLastName();
            }
        }
        String reviewerName = null;
        if (leave.getReviewedBy() != null) {
            User reviewer = userRepository.findById(leave.getReviewedBy()).orElse(null);
            if (reviewer != null) {
                if (reviewer.getEmployeeId() != null) {
                    Employee revEmp = employeeRepository.findById(reviewer.getEmployeeId()).orElse(null);
                    if (revEmp != null) reviewerName = revEmp.getFirstName() + " " + revEmp.getLastName();
                }
                if (reviewerName == null) reviewerName = reviewer.getUsername();
            }
        }
        return new LeaveResponse(
                leave.getId(),
                leave.getEmployeeId(),
                empCode,
                empName,
                leave.getLeaveType() != null ? leave.getLeaveType().name() : null,
                leave.getStartDate(),
                leave.getEndDate(),
                leave.getDays(),
                leave.getReason(),
                leave.getStatus() != null ? leave.getStatus().name() : null,
                leave.getAdminRemarks(),
                leave.getReviewedBy(),
                reviewerName,
                leave.getReviewedAt(),
                leave.getCreatedAt(),
                leave.getUpdatedAt()
        );
    }

    public List<LeaveResponse> toLeaveResponses(List<LeaveRequest> leaves) {
        if (leaves == null || leaves.isEmpty()) return Collections.emptyList();

        Set<String> empIds = leaves.stream()
                .map(LeaveRequest::getEmployeeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<String> reviewerIds = leaves.stream()
                .map(LeaveRequest::getReviewedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<String, Employee> empMap = employeeRepository.findAllById(empIds).stream()
                .collect(Collectors.toMap(Employee::getId, Function.identity()));

        Map<String, User> userMap = userRepository.findAllById(reviewerIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return leaves.stream().map(leave -> {
            String empCode = null;
            String empName = null;
            if (leave.getEmployeeId() != null && empMap.containsKey(leave.getEmployeeId())) {
                Employee emp = empMap.get(leave.getEmployeeId());
                empCode = emp.getEmployeeCode();
                empName = emp.getFirstName() + " " + emp.getLastName();
            }

            String reviewerName = null;
            if (leave.getReviewedBy() != null && userMap.containsKey(leave.getReviewedBy())) {
                User reviewer = userMap.get(leave.getReviewedBy());
                if (reviewer.getEmployeeId() != null && empMap.containsKey(reviewer.getEmployeeId())) {
                    Employee revEmp = empMap.get(reviewer.getEmployeeId());
                    reviewerName = revEmp.getFirstName() + " " + revEmp.getLastName();
                }
                if (reviewerName == null) reviewerName = reviewer.getUsername();
            }

            return new LeaveResponse(
                    leave.getId(),
                    leave.getEmployeeId(),
                    empCode,
                    empName,
                    leave.getLeaveType() != null ? leave.getLeaveType().name() : null,
                    leave.getStartDate(),
                    leave.getEndDate(),
                    leave.getDays(),
                    leave.getReason(),
                    leave.getStatus() != null ? leave.getStatus().name() : null,
                    leave.getAdminRemarks(),
                    leave.getReviewedBy(),
                    reviewerName,
                    leave.getReviewedAt(),
                    leave.getCreatedAt(),
                    leave.getUpdatedAt()
            );
        }).toList();
    }

    // --- Task ---
    public TaskResponse toTaskResponse(Task task) {
        if (task == null) return null;
        String assigneeName = null;
        String assigneeCode = null;
        if (task.getAssignedTo() != null) {
            Employee emp = employeeRepository.findById(task.getAssignedTo()).orElse(null);
            if (emp != null) {
                assigneeName = emp.getFirstName() + " " + emp.getLastName();
                assigneeCode = emp.getEmployeeCode();
            }
        }
        String assignerName = null;
        if (task.getAssignedBy() != null) {
            User assigner = userRepository.findById(task.getAssignedBy()).orElse(null);
            if (assigner != null) {
                if (assigner.getEmployeeId() != null) {
                    Employee asEmp = employeeRepository.findById(assigner.getEmployeeId()).orElse(null);
                    if (asEmp != null) assignerName = asEmp.getFirstName() + " " + asEmp.getLastName();
                }
                if (assignerName == null) assignerName = assigner.getUsername();
            }
        }

        LocalDate today = timeProvider.today();
        boolean overdue = task.getDueDate() != null && task.getDueDate().isBefore(today) && task.getStatus() != TaskStatus.COMPLETED;

        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getAssignedTo(),
                assigneeName,
                assigneeCode,
                task.getAssignedBy(),
                assignerName,
                task.getPriority() != null ? task.getPriority().name() : null,
                task.getDueDate(),
                task.getStatus() != null ? task.getStatus().name() : null,
                task.getCompletedAt(),
                overdue,
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }

    public List<TaskResponse> toTaskResponses(List<Task> tasks) {
        if (tasks == null || tasks.isEmpty()) return Collections.emptyList();

        Set<String> empIds = tasks.stream()
                .map(Task::getAssignedTo)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<String> assignerIds = tasks.stream()
                .map(Task::getAssignedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<String, Employee> empMap = employeeRepository.findAllById(empIds).stream()
                .collect(Collectors.toMap(Employee::getId, Function.identity()));

        Map<String, User> userMap = userRepository.findAllById(assignerIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        LocalDate today = timeProvider.today();

        return tasks.stream().map(task -> {
            String assigneeName = null;
            String assigneeCode = null;
            if (task.getAssignedTo() != null && empMap.containsKey(task.getAssignedTo())) {
                Employee emp = empMap.get(task.getAssignedTo());
                assigneeName = emp.getFirstName() + " " + emp.getLastName();
                assigneeCode = emp.getEmployeeCode();
            }

            String assignerName = null;
            if (task.getAssignedBy() != null && userMap.containsKey(task.getAssignedBy())) {
                User assigner = userMap.get(task.getAssignedBy());
                if (assigner.getEmployeeId() != null && empMap.containsKey(assigner.getEmployeeId())) {
                    Employee asEmp = empMap.get(assigner.getEmployeeId());
                    assignerName = asEmp.getFirstName() + " " + asEmp.getLastName();
                }
                if (assignerName == null) assignerName = assigner.getUsername();
            }

            boolean overdue = task.getDueDate() != null && task.getDueDate().isBefore(today) && task.getStatus() != TaskStatus.COMPLETED;

            return new TaskResponse(
                    task.getId(),
                    task.getTitle(),
                    task.getDescription(),
                    task.getAssignedTo(),
                    assigneeName,
                    assigneeCode,
                    task.getAssignedBy(),
                    assignerName,
                    task.getPriority() != null ? task.getPriority().name() : null,
                    task.getDueDate(),
                    task.getStatus() != null ? task.getStatus().name() : null,
                    task.getCompletedAt(),
                    overdue,
                    task.getCreatedAt(),
                    task.getUpdatedAt()
            );
        }).toList();
    }
}
