package com.amagen.ems.service;

import com.amagen.ems.dto.request.DesignationRequest;
import com.amagen.ems.dto.response.DesignationResponse;
import com.amagen.ems.exception.BadRequestException;
import com.amagen.ems.exception.ConflictException;
import com.amagen.ems.exception.ResourceNotFoundException;
import com.amagen.ems.model.Department;
import com.amagen.ems.model.Designation;
import com.amagen.ems.repository.DepartmentRepository;
import com.amagen.ems.repository.DesignationRepository;
import com.amagen.ems.repository.EmployeeRepository;
import com.amagen.ems.util.ResponseMapper;
import com.amagen.ems.util.TimeProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DesignationService {

    private final DesignationRepository designationRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final ResponseMapper responseMapper;
    private final TimeProvider timeProvider;

    public List<DesignationResponse> getDesignations(Boolean active, String departmentId) {
        List<Designation> list;

        if (departmentId != null && !departmentId.isBlank()) {
            if (active != null) {
                // Return department-specific active designations + shared (null department) active designations
                List<Designation> deptList = designationRepository.findByDepartmentIdAndActive(departmentId.trim(), active);
                List<Designation> sharedList = designationRepository.findByDepartmentIdIsNullAndActive(active);
                list = new ArrayList<>(deptList);
                list.addAll(sharedList);
            } else {
                List<Designation> all = designationRepository.findAll();
                list = all.stream()
                        .filter(d -> d.getDepartmentId() == null || d.getDepartmentId().equals(departmentId.trim()))
                        .toList();
            }
        } else if (active != null) {
            list = designationRepository.findByActive(active);
        } else {
            list = designationRepository.findAll();
        }

        return responseMapper.toDesignationResponses(list);
    }

    public DesignationResponse getDesignationById(String id) {
        Designation designation = designationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Designation not found with id: " + id));
        return responseMapper.toDesignationResponse(designation);
    }

    public DesignationResponse createDesignation(DesignationRequest request) {
        String title = request.title().trim();

        if (designationRepository.findByTitleIgnoreCase(title).isPresent()) {
            throw new ConflictException("Designation with title '" + title + "' already exists");
        }

        String deptId = request.departmentId() != null && !request.departmentId().isBlank() ? request.departmentId().trim() : null;
        if (deptId != null) {
            Department dept = departmentRepository.findById(deptId)
                    .orElseThrow(() -> new BadRequestException("Department does not exist"));
            if (!dept.isActive()) {
                throw new BadRequestException("Cannot tie designation to an inactive department");
            }
        }

        LocalDateTime now = timeProvider.now();
        Designation designation = Designation.builder()
                .title(title)
                .description(request.description() != null ? request.description().trim() : null)
                .departmentId(deptId)
                .active(true)
                .createdAt(now)
                .updatedAt(now)
                .build();

        Designation saved = designationRepository.save(designation);
        return responseMapper.toDesignationResponse(saved);
    }

    public DesignationResponse updateDesignation(String id, DesignationRequest request) {
        Designation designation = designationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Designation not found with id: " + id));

        String title = request.title().trim();
        if (designationRepository.existsByTitleIgnoreCaseAndIdNot(title, id)) {
            throw new ConflictException("Another designation with title '" + title + "' already exists");
        }

        String deptId = request.departmentId() != null && !request.departmentId().isBlank() ? request.departmentId().trim() : null;
        if (deptId != null && (designation.getDepartmentId() == null || !designation.getDepartmentId().equals(deptId))) {
            Department dept = departmentRepository.findById(deptId)
                    .orElseThrow(() -> new BadRequestException("Department does not exist"));
            if (!dept.isActive()) {
                throw new BadRequestException("Cannot tie designation to an inactive department");
            }
        }

        designation.setTitle(title);
        designation.setDescription(request.description() != null ? request.description().trim() : null);
        designation.setDepartmentId(deptId);
        designation.setUpdatedAt(timeProvider.now());

        Designation updated = designationRepository.save(designation);
        return responseMapper.toDesignationResponse(updated);
    }

    public DesignationResponse setStatus(String id, boolean active) {
        Designation designation = designationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Designation not found with id: " + id));

        designation.setActive(active);
        designation.setUpdatedAt(timeProvider.now());
        Designation updated = designationRepository.save(designation);
        return responseMapper.toDesignationResponse(updated);
    }

    public void deleteDesignation(String id) {
        Designation designation = designationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Designation not found with id: " + id));

        long employeeCount = employeeRepository.countByDesignationId(id);
        if (employeeCount > 0) {
            throw new ConflictException("Cannot delete designation referenced by " + employeeCount + " employee(s). Disable it instead.");
        }

        designationRepository.delete(designation);
    }
}
