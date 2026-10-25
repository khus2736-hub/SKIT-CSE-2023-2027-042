package com.amagen.ems.controller;

import com.amagen.ems.dto.response.AttendanceResponse;
import com.amagen.ems.dto.response.PageResponse;
import com.amagen.ems.model.enums.AttendanceStatus;
import com.amagen.ems.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping("/check-in")
    public ResponseEntity<AttendanceResponse> checkIn() {
        AttendanceResponse response = attendanceService.checkIn();
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/check-out")
    public ResponseEntity<AttendanceResponse> checkOut() {
        return ResponseEntity.ok(attendanceService.checkOut());
    }

    @GetMapping("/today")
    public ResponseEntity<AttendanceResponse> getToday() {
        AttendanceResponse response = attendanceService.getToday();
        if (response == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my")
    public ResponseEntity<PageResponse<AttendanceResponse>> getMyAttendance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 10, sort = "date", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(attendanceService.getMyAttendance(from, to, pageable));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponse<AttendanceResponse>> getAttendanceAdmin(
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String departmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) AttendanceStatus status,
            @PageableDefault(size = 10, sort = "date", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(attendanceService.getAttendanceAdmin(employeeId, departmentId, from, to, status, pageable));
    }
}
