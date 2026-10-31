package com.amagen.ems.controller;

import com.amagen.ems.dto.request.LeaveRequestDto;
import com.amagen.ems.dto.request.LeaveReviewRequest;
import com.amagen.ems.dto.response.LeaveResponse;
import com.amagen.ems.dto.response.PageResponse;
import com.amagen.ems.model.enums.LeaveStatus;
import com.amagen.ems.model.enums.LeaveType;
import com.amagen.ems.service.LeaveService;
import jakarta.validation.Valid;
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
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;

    @PostMapping
    public ResponseEntity<LeaveResponse> applyLeave(@Valid @RequestBody LeaveRequestDto request) {
        LeaveResponse response = leaveService.applyLeave(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my")
    public ResponseEntity<PageResponse<LeaveResponse>> getMyLeaves(
            @RequestParam(required = false) LeaveStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(leaveService.getMyLeaves(status, pageable));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<LeaveResponse> cancelLeave(@PathVariable String id) {
        return ResponseEntity.ok(leaveService.cancelLeave(id));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponse<LeaveResponse>> getLeavesAdmin(
            @RequestParam(required = false) LeaveStatus status,
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) LeaveType leaveType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(leaveService.getLeavesAdmin(status, employeeId, leaveType, from, to, pageable));
    }

    @PatchMapping("/{id}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LeaveResponse> reviewLeave(
            @PathVariable String id,
            @Valid @RequestBody LeaveReviewRequest request
    ) {
        return ResponseEntity.ok(leaveService.reviewLeave(id, request));
    }
}
