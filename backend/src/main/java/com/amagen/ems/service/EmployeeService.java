package com.amagen.ems.service;

import com.amagen.ems.dto.request.CreateEmployeeRequest;
import com.amagen.ems.dto.request.UpdateEmployeeRequest;
import com.amagen.ems.dto.response.EmployeeResponse;
import com.amagen.ems.dto.response.PageResponse;
import com.amagen.ems.exception.BadRequestException;
import com.amagen.ems.exception.ConflictException;
import com.amagen.ems.exception.ResourceNotFoundException;
import com.amagen.ems.model.Department;
import com.amagen.ems.model.Designation;
import com.amagen.ems.model.Employee;
import com.amagen.ems.model.User;
import com.amagen.ems.model.enums.EmployeeStatus;
import com.amagen.ems.model.enums.Role;
import com.amagen.ems.repository.DepartmentRepository;
import com.amagen.ems.repository.DesignationRepository;
import com.amagen.ems.repository.EmployeeRepository;
import com.amagen.ems.repository.UserRepository;
import com.amagen.ems.security.SecurityUtils;
import com.amagen.ems.util.ResponseMapper;
import com.amagen.ems.util.TimeProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final DesignationRepository designationRepository;
    private final SequenceGeneratorService sequenceGeneratorService;
    private final PasswordEncoder passwordEncoder;
    private final ResponseMapper responseMapper;
    private final TimeProvider timeProvider;
    private final MongoTemplate mongoTemplate;

    public PageResponse<EmployeeResponse> getEmployees(
            String search,
            String departmentId,
            String designationId,
            EmployeeStatus status,
            Pageable pageable
    ) {
        Query query = new Query();
        List<Criteria> criteriaList = new ArrayList<>();

        if (departmentId != null && !departmentId.isBlank()) {
            criteriaList.add(Criteria.where("departmentId").is(departmentId.trim()));
        }

        if (designationId != null && !designationId.isBlank()) {
            criteriaList.add(Criteria.where("designationId").is(designationId.trim()));
        }

        if (status != null) {
            criteriaList.add(Criteria.where("status").is(status));
        }

        if (search != null && !search.isBlank()) {
            String[] words = search.trim().split("\\s+");
            for (String word : words) {
                String pattern = ".*" + Pattern.quote(word) + ".*";
                Criteria wordCriteria = new Criteria().orOperator(
                        Criteria.where("employeeCode").regex(pattern, "i"),
                        Criteria.where("firstName").regex(pattern, "i"),
                        Criteria.where("lastName").regex(pattern, "i"),
                        Criteria.where("email").regex(pattern, "i"),
                        Criteria.where("phone").regex(pattern, "i")
                );
                criteriaList.add(wordCriteria);
            }
        }

        if (!criteriaList.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteriaList.toArray(new Criteria[0])));
        }

        long total = mongoTemplate.count(query, Employee.class);

        query.with(pageable);
        List<Employee> employees = mongoTemplate.find(query, Employee.class);

        List<EmployeeResponse> content = responseMapper.toEmployeeResponses(employees);
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

    public List<EmployeeResponse> getAllActive() {
        List<Employee> activeEmployees = employeeRepository.findByStatus(EmployeeStatus.ACTIVE);
        return responseMapper.toEmployeeResponses(activeEmployees);
    }

    public EmployeeResponse getById(String id) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        return responseMapper.toEmployeeResponse(emp);
    }

    public EmployeeResponse getMe() {
        String employeeId = SecurityUtils.requireEmployeeId();
        return getById(employeeId);
    }

    public EmployeeResponse createEmployee(CreateEmployeeRequest request) {
        String email = request.email().trim().toLowerCase();
        String phone = request.phone().trim();

        // Unique email & phone check
        if (employeeRepository.existsByEmail(email) || userRepository.existsByUsername(email)) {
            throw new ConflictException("An employee or user with this email already exists");
        }
        if (employeeRepository.existsByPhone(phone)) {
            throw new ConflictException("An employee with this phone number already exists");
        }

        // Validate department
        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new BadRequestException("Department does not exist"));
        if (!department.isActive()) {
            throw new BadRequestException("Cannot assign inactive department to new employee");
        }

        // Validate designation
        Designation designation = designationRepository.findById(request.designationId())
                .orElseThrow(() -> new BadRequestException("Designation does not exist"));
        if (!designation.isActive()) {
            throw new BadRequestException("Cannot assign inactive designation to new employee");
        }

        // A designation tied to a department must match employee's department
        if (designation.getDepartmentId() != null && !designation.getDepartmentId().equals(department.getId())) {
            throw new BadRequestException("Designation belongs to a different department");
        }

        LocalDateTime now = timeProvider.now();
        String employeeCode = sequenceGeneratorService.generateEmployeeCode();

        Employee employee = Employee.builder()
                .employeeCode(employeeCode)
                .firstName(request.firstName().trim())
                .lastName(request.lastName().trim())
                .email(email)
                .phone(phone)
                .address(request.address() != null ? request.address().trim() : null)
                .departmentId(department.getId())
                .designationId(designation.getId())
                .joiningDate(request.joiningDate())
                .status(EmployeeStatus.ACTIVE)
                .createdAt(now)
                .updatedAt(now)
                .build();

        Employee savedEmployee = employeeRepository.save(employee);

        try {
            Role role = request.role() != null ? request.role() : Role.EMPLOYEE;
            User user = User.builder()
                    .username(email)
                    .password(passwordEncoder.encode(request.password()))
                    .role(role)
                    .employeeId(savedEmployee.getId())
                    .enabled(true)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();

            User savedUser = userRepository.save(user);

            savedEmployee.setUserId(savedUser.getId());
            savedEmployee = employeeRepository.save(savedEmployee);

            return responseMapper.toEmployeeResponse(savedEmployee);
        } catch (Exception e) {
            // If saving user fails, delete the just-created employee
            employeeRepository.deleteById(savedEmployee.getId());
            throw new BadRequestException("Failed to create employee user account: " + e.getMessage());
        }
    }

    public EmployeeResponse updateEmployee(String id, UpdateEmployeeRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        String email = request.email().trim().toLowerCase();
        String phone = request.phone().trim();

        if (employeeRepository.existsByEmailAndIdNot(email, id)) {
            throw new ConflictException("Another employee with this email already exists");
        }
        if (employeeRepository.existsByPhoneAndIdNot(phone, id)) {
            throw new ConflictException("Another employee with this phone number already exists");
        }

        // Department check
        if (!employee.getDepartmentId().equals(request.departmentId())) {
            Department dept = departmentRepository.findById(request.departmentId())
                    .orElseThrow(() -> new BadRequestException("Department does not exist"));
            if (!dept.isActive()) {
                throw new BadRequestException("Cannot assign an inactive department");
            }
        }

        // Designation check
        if (!employee.getDesignationId().equals(request.designationId())) {
            Designation desig = designationRepository.findById(request.designationId())
                    .orElseThrow(() -> new BadRequestException("Designation does not exist"));
            if (!desig.isActive()) {
                throw new BadRequestException("Cannot assign an inactive designation");
            }
            if (desig.getDepartmentId() != null && !desig.getDepartmentId().equals(request.departmentId())) {
                throw new BadRequestException("Designation belongs to a different department");
            }
        }

        String oldEmail = employee.getEmail();
        employee.setFirstName(request.firstName().trim());
        employee.setLastName(request.lastName().trim());
        employee.setEmail(email);
        employee.setPhone(phone);
        employee.setAddress(request.address() != null ? request.address().trim() : null);
        employee.setDepartmentId(request.departmentId());
        employee.setDesignationId(request.designationId());
        employee.setJoiningDate(request.joiningDate());
        employee.setUpdatedAt(timeProvider.now());

        Employee updated = employeeRepository.save(employee);

        // Update linked user's username if email changed
        if (!oldEmail.equalsIgnoreCase(email) && employee.getUserId() != null) {
            userRepository.findById(employee.getUserId()).ifPresent(user -> {
                user.setUsername(email);
                user.setUpdatedAt(timeProvider.now());
                userRepository.save(user);
            });
        }

        return responseMapper.toEmployeeResponse(updated);
    }

    public EmployeeResponse deactivate(String id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        // Check if this employee's linked user is the current user or last active admin
        if (employee.getUserId() != null) {
            String currentUserId = SecurityUtils.getCurrentUserId();
            if (employee.getUserId().equals(currentUserId)) {
                throw new BadRequestException("An admin cannot deactivate their own account");
            }

            User linkedUser = userRepository.findById(employee.getUserId()).orElse(null);
            if (linkedUser != null && linkedUser.getRole() == Role.ADMIN) {
                long activeAdminCount = userRepository.countByRoleAndEnabled(Role.ADMIN, true);
                if (activeAdminCount <= 1 && linkedUser.isEnabled()) {
                    throw new BadRequestException("Cannot deactivate the last active administrator");
                }
            }

            if (linkedUser != null) {
                linkedUser.setEnabled(false);
                linkedUser.setUpdatedAt(timeProvider.now());
                userRepository.save(linkedUser);
            }
        }

        employee.setStatus(EmployeeStatus.INACTIVE);
        employee.setUpdatedAt(timeProvider.now());
        Employee updated = employeeRepository.save(employee);

        return responseMapper.toEmployeeResponse(updated);
    }

    public EmployeeResponse activate(String id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        employee.setStatus(EmployeeStatus.ACTIVE);
        employee.setUpdatedAt(timeProvider.now());
        Employee updated = employeeRepository.save(employee);

        if (employee.getUserId() != null) {
            userRepository.findById(employee.getUserId()).ifPresent(user -> {
                user.setEnabled(true);
                user.setUpdatedAt(timeProvider.now());
                userRepository.save(user);
            });
        }

        return responseMapper.toEmployeeResponse(updated);
    }
}
