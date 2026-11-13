package com.amagen.ems.controller;

import com.amagen.ems.dto.response.AttendanceReportRow;
import com.amagen.ems.dto.response.EmployeeResponse;
import com.amagen.ems.dto.response.LeaveReportRow;
import com.amagen.ems.dto.response.TaskReportRow;
import com.amagen.ems.model.enums.EmployeeStatus;
import com.amagen.ems.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/employees")
    public ResponseEntity<List<EmployeeResponse>> getEmployeeReport(
            @RequestParam(required = false) String departmentId,
            @RequestParam(required = false) EmployeeStatus status
    ) {
        return ResponseEntity.ok(reportService.getEmployeeReport(departmentId, status));
    }

    @GetMapping("/attendance")
    public ResponseEntity<List<AttendanceReportRow>> getAttendanceReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String departmentId
    ) {
        return ResponseEntity.ok(reportService.getAttendanceReport(from, to, departmentId));
    }

    @GetMapping("/leaves")
    public ResponseEntity<List<LeaveReportRow>> getLeaveReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String departmentId
    ) {
        return ResponseEntity.ok(reportService.getLeaveReport(from, to, departmentId));
    }

    @GetMapping("/tasks")
    public ResponseEntity<List<TaskReportRow>> getTaskReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String departmentId
    ) {
        return ResponseEntity.ok(reportService.getTaskReport(from, to, departmentId));
    }
}
