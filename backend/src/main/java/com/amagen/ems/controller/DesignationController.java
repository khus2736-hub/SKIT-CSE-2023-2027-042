package com.amagen.ems.controller;

import com.amagen.ems.dto.request.DesignationRequest;
import com.amagen.ems.dto.response.DesignationResponse;
import com.amagen.ems.service.DesignationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/designations")
@RequiredArgsConstructor
public class DesignationController {

    private final DesignationService designationService;

    @GetMapping
    public ResponseEntity<List<DesignationResponse>> getDesignations(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String departmentId
    ) {
        return ResponseEntity.ok(designationService.getDesignations(active, departmentId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DesignationResponse> getDesignationById(@PathVariable String id) {
        return ResponseEntity.ok(designationService.getDesignationById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DesignationResponse> createDesignation(@Valid @RequestBody DesignationRequest request) {
        DesignationResponse response = designationService.createDesignation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DesignationResponse> updateDesignation(
            @PathVariable String id,
            @Valid @RequestBody DesignationRequest request
    ) {
        return ResponseEntity.ok(designationService.updateDesignation(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DesignationResponse> setStatus(
            @PathVariable String id,
            @RequestParam boolean active
    ) {
        return ResponseEntity.ok(designationService.setStatus(id, active));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDesignation(@PathVariable String id) {
        designationService.deleteDesignation(id);
        return ResponseEntity.noContent().build();
    }
}
