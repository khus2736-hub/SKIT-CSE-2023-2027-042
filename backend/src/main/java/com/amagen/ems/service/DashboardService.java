package com.amagen.ems.service;

import com.amagen.ems.dto.response.*;
import com.amagen.ems.model.*;
import com.amagen.ems.model.enums.AttendanceStatus;
import com.amagen.ems.model.enums.EmployeeStatus;
import com.amagen.ems.model.enums.LeaveStatus;
import com.amagen.ems.model.enums.TaskStatus;
import com.amagen.ems.repository.*;
import com.amagen.ems.security.SecurityUtils;
import com.amagen.ems.util.ResponseMapper;
import com.amagen.ems.util.TimeProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final DesignationRepository designationRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final TaskRepository taskRepository;
    private final ResponseMapper responseMapper;
    private final TimeProvider timeProvider;
    private final MongoTemplate mongoTemplate;

    public AdminDashboardResponse getAdminDashboard() {
        LocalDate today = timeProvider.today();

        long totalEmployees = employeeRepository.count();
        long activeEmployees = employeeRepository.countByStatus(EmployeeStatus.ACTIVE);
        long inactiveEmployees = totalEmployees - activeEmployees;

        long totalDepartments = departmentRepository.count();
        long totalDesignations = designationRepository.count();

        // Attendance today
        long presentToday = attendanceRepository.countByDateAndStatus(today, AttendanceStatus.PRESENT);
        long halfDayToday = attendanceRepository.countByDateAndStatus(today, AttendanceStatus.HALF_DAY);
        long lateToday = attendanceRepository.countByDateAndLate(today, true);
        long markedTotal = presentToday + halfDayToday;
        long notMarked = Math.max(0, activeEmployees - markedTotal);

        AdminDashboardResponse.AttendanceTodayStats attendanceToday =
                new AdminDashboardResponse.AttendanceTodayStats(presentToday, halfDayToday, lateToday, notMarked);

        // Pending leaves
        Query pendingLeavesQuery = new Query(Criteria.where("status").is(LeaveStatus.PENDING));
        long pendingLeaves = mongoTemplate.count(pendingLeavesQuery, LeaveRequest.class);

        // Task stats
        long totalTasks = taskRepository.count();
        long pendingTasks = taskRepository.countByStatus(TaskStatus.PENDING);
        long inProgressTasks = taskRepository.countByStatus(TaskStatus.IN_PROGRESS);
        long completedTasks = taskRepository.countByStatus(TaskStatus.COMPLETED);

        Query overdueTasksQuery = new Query(
                Criteria.where("dueDate").lt(today)
                        .and("status").ne(TaskStatus.COMPLETED)
        );
        long overdueTasks = mongoTemplate.count(overdueTasksQuery, Task.class);

        AdminDashboardResponse.TaskStats taskStats =
                new AdminDashboardResponse.TaskStats(totalTasks, pendingTasks, inProgressTasks, completedTasks, overdueTasks);

        // Employees by department (ACTIVE employees, include departments with 0)
        List<Department> departments = departmentRepository.findByActive(true);
        Map<String, Long> countMap = employeeRepository.countEmployeesByDepartment().stream()
                .filter(c -> c.getId() != null)
                .collect(Collectors.toMap(DepartmentEmployeeCount::getId, DepartmentEmployeeCount::getCount));

        List<AdminDashboardResponse.DepartmentCount> employeesByDepartment = departments.stream()
                .map(d -> new AdminDashboardResponse.DepartmentCount(d.getName(), countMap.getOrDefault(d.getId(), 0L)))
                .toList();

        // 7-day attendance trend (last 7 days ending today)
        LocalDate sevenDaysAgo = today.minusDays(6);
        List<Attendance> last7DaysAttendance = attendanceRepository.findByDateBetween(sevenDaysAgo, today);

        Map<LocalDate, Long> attendanceCountByDate = last7DaysAttendance.stream()
                .filter(a -> a.getStatus() == AttendanceStatus.PRESENT || a.getStatus() == AttendanceStatus.HALF_DAY)
                .collect(Collectors.groupingBy(Attendance::getDate, Collectors.counting()));

        List<AdminDashboardResponse.AttendanceTrendItem> attendanceTrend = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        for (int i = 0; i < 7; i++) {
            LocalDate date = sevenDaysAgo.plusDays(i);
            long count = attendanceCountByDate.getOrDefault(date, 0L);
            attendanceTrend.add(new AdminDashboardResponse.AttendanceTrendItem(date.format(formatter), count));
        }

        // Recent 5 PENDING leave requests
        Query recentLeavesQuery = new Query(Criteria.where("status").is(LeaveStatus.PENDING))
                .with(Sort.by(Sort.Direction.DESC, "createdAt"))
                .limit(5);
        List<LeaveRequest> recentLeaves = mongoTemplate.find(recentLeavesQuery, LeaveRequest.class);
        List<LeaveResponse> recentLeaveResponses = responseMapper.toLeaveResponses(recentLeaves);

        return new AdminDashboardResponse(
                totalEmployees,
                activeEmployees,
                inactiveEmployees,
                totalDepartments,
                totalDesignations,
                attendanceToday,
                pendingLeaves,
                taskStats,
                employeesByDepartment,
                attendanceTrend,
                recentLeaveResponses
        );
    }

    public EmployeeDashboardResponse getEmployeeDashboard() {
        String employeeId = SecurityUtils.requireEmployeeId();
        LocalDate today = timeProvider.today();

        Employee employee = employeeRepository.findById(employeeId).orElse(null);
        EmployeeResponse employeeResponse = responseMapper.toEmployeeResponse(employee);

        // Today attendance
        Attendance todayAtt = attendanceRepository.findByEmployeeIdAndDate(employeeId, today).orElse(null);
        AttendanceResponse todayAttendance = responseMapper.toAttendanceResponse(todayAtt);

        // Month attendance
        LocalDate startOfMonth = today.withDayOfMonth(1);
        List<Attendance> monthRecords = attendanceRepository.findByEmployeeIdAndDateBetween(employeeId, startOfMonth, today);

        long presentDays = monthRecords.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count();
        long halfDays = monthRecords.stream().filter(a -> a.getStatus() == AttendanceStatus.HALF_DAY).count();
        long lateDays = monthRecords.stream().filter(Attendance::isLate).count();
        double totalHours = monthRecords.stream()
                .mapToDouble(a -> a.getWorkHours() != null ? a.getWorkHours() : 0.0)
                .sum();
        totalHours = Math.round(totalHours * 100.0) / 100.0;

        EmployeeDashboardResponse.MonthAttendance monthAttendance =
                new EmployeeDashboardResponse.MonthAttendance(presentDays, halfDays, lateDays, totalHours);

        // Leave summary
        long pendingLeaves = leaveRequestRepository.countByEmployeeIdAndStatus(employeeId, LeaveStatus.PENDING);
        long approvedLeaves = leaveRequestRepository.countByEmployeeIdAndStatus(employeeId, LeaveStatus.APPROVED);
        long rejectedLeaves = leaveRequestRepository.countByEmployeeIdAndStatus(employeeId, LeaveStatus.REJECTED);

        LocalDate startOfYear = today.withDayOfYear(1);
        LocalDate endOfYear = today.withDayOfYear(today.lengthOfYear());

        Query approvedLeavesYearQuery = new Query(
                Criteria.where("employeeId").is(employeeId)
                        .and("status").is(LeaveStatus.APPROVED)
                        .and("startDate").gte(startOfYear).lte(endOfYear)
        );
        List<LeaveRequest> approvedLeavesThisYear = mongoTemplate.find(approvedLeavesYearQuery, LeaveRequest.class);
        long approvedDaysThisYear = approvedLeavesThisYear.stream().mapToLong(LeaveRequest::getDays).sum();

        EmployeeDashboardResponse.LeaveSummary leaveSummary =
                new EmployeeDashboardResponse.LeaveSummary(pendingLeaves, approvedLeaves, rejectedLeaves, approvedDaysThisYear);

        // Task stats
        long totalTasks = taskRepository.countByAssignedTo(employeeId);
        long pendingTasks = taskRepository.countByAssignedToAndStatus(employeeId, TaskStatus.PENDING);
        long inProgressTasks = taskRepository.countByAssignedToAndStatus(employeeId, TaskStatus.IN_PROGRESS);
        long completedTasks = taskRepository.countByAssignedToAndStatus(employeeId, TaskStatus.COMPLETED);

        Query overdueTaskQuery = new Query(
                Criteria.where("assignedTo").is(employeeId)
                        .and("dueDate").lt(today)
                        .and("status").ne(TaskStatus.COMPLETED)
        );
        long overdueTasks = mongoTemplate.count(overdueTaskQuery, Task.class);

        EmployeeDashboardResponse.TaskStats taskStats =
                new EmployeeDashboardResponse.TaskStats(totalTasks, pendingTasks, inProgressTasks, completedTasks, overdueTasks);

        // Upcoming tasks: up to 5 non-completed tasks ordered by due date
        Query upcomingTasksQuery = new Query(
                Criteria.where("assignedTo").is(employeeId)
                        .and("status").ne(TaskStatus.COMPLETED)
        ).with(Sort.by(Sort.Direction.ASC, "dueDate")).limit(5);

        List<Task> upcomingTasks = mongoTemplate.find(upcomingTasksQuery, Task.class);
        List<TaskResponse> upcomingTaskResponses = responseMapper.toTaskResponses(upcomingTasks);

        return new EmployeeDashboardResponse(
                employeeResponse,
                todayAttendance,
                monthAttendance,
                leaveSummary,
                taskStats,
                upcomingTaskResponses
        );
    }
}
