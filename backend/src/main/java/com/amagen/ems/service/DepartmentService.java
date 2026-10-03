package com.amagen.ems.service;

import com.amagen.ems.dto.request.DepartmentRequest;
import com.amagen.ems.dto.response.DepartmentResponse;
import com.amagen.ems.exception.ConflictException;
import com.amagen.ems.exception.ResourceNotFoundException;
import com.amagen.ems.model.Department;
import com.amagen.ems.repository.DepartmentRepository;
import com.amagen.ems.repository.DesignationRepository;
import com.amagen.ems.repository.EmployeeRepository;
import com.amagen.ems.util.ResponseMapper;
import com.amagen.ems.util.TimeProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final DesignationRepository designationRepository;
    private final EmployeeRepository employeeRepository;
    private final ResponseMapper responseMapper;
    private final TimeProvider timeProvider;

    public List<DepartmentResponse> getDepartments(Boolean active) {
        List<Department> list;
        if (active != null) {
            list = departmentRepository.findByActive(active);
        } else {
            list = departmentRepository.findAll();
        }
        return responseMapper.toDepartmentResponses(list);
    }

    public DepartmentResponse getDepartmentById(String id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
        return responseMapper.toDepartmentResponse(dept);
    }

    public DepartmentResponse createDepartment(DepartmentRequest request) {
        String name = request.name().trim();
        String code = request.code().trim().toUpperCase();

        if (departmentRepository.findByNameIgnoreCase(name).isPresent()) {
            throw new ConflictException("Department with name '" + name + "' already exists");
        }
        if (departmentRepository.findByCodeIgnoreCase(code).isPresent()) {
            throw new ConflictException("Department with code '" + code + "' already exists");
        }

        LocalDateTime now = timeProvider.now();
        Department department = Department.builder()
                .name(name)
                .code(code)
                .description(request.description() != null ? request.description().trim() : null)
                .active(true)
                .createdAt(now)
                .updatedAt(now)
                .build();

        Department saved = departmentRepository.save(department);
        return responseMapper.toDepartmentResponse(saved);
    }

    public DepartmentResponse updateDepartment(String id, DepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        String name = request.name().trim();
        String code = request.code().trim().toUpperCase();

        if (departmentRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ConflictException("Another department with name '" + name + "' already exists");
        }
        if (departmentRepository.existsByCodeIgnoreCaseAndIdNot(code, id)) {
            throw new ConflictException("Another department with code '" + code + "' already exists");
        }

        department.setName(name);
        department.setCode(code);
        department.setDescription(request.description() != null ? request.description().trim() : null);
        department.setUpdatedAt(timeProvider.now());

        Department updated = departmentRepository.save(department);
        return responseMapper.toDepartmentResponse(updated);
    }

    public DepartmentResponse setStatus(String id, boolean active) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        department.setActive(active);
        department.setUpdatedAt(timeProvider.now());
        Department updated = departmentRepository.save(department);
        return responseMapper.toDepartmentResponse(updated);
    }

    public void deleteDepartment(String id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        long employeeCount = employeeRepository.countByDepartmentId(id);
        if (employeeCount > 0) {
            throw new ConflictException("Cannot delete department referenced by " + employeeCount + " employee(s). Disable it instead.");
        }

        long designationCount = designationRepository.countByDepartmentId(id);
        if (designationCount > 0) {
            throw new ConflictException("Cannot delete department referenced by " + designationCount + " designation(s). Disable it instead.");
        }

        departmentRepository.delete(department);
    }
}
