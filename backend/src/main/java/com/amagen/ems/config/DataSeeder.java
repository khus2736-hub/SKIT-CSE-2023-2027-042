package com.amagen.ems.config;

import com.amagen.ems.model.Department;
import com.amagen.ems.model.Designation;
import com.amagen.ems.model.User;
import com.amagen.ems.model.enums.Role;
import com.amagen.ems.repository.DepartmentRepository;
import com.amagen.ems.repository.DesignationRepository;
import com.amagen.ems.repository.UserRepository;
import com.amagen.ems.util.TimeProvider;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final DesignationRepository designationRepository;
    private final PasswordEncoder passwordEncoder;
    private final TimeProvider timeProvider;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${app.seed-sample-data:false}")
    private boolean seedSampleData;

    @Override
    public void run(String... args) {
        seedAdminUser();

        if (seedSampleData) {
            seedDepartmentsAndDesignations();
        }
    }

    private void seedAdminUser() {
        boolean adminExists = userRepository.countByRoleAndEnabled(Role.ADMIN, true) > 0;
        if (!adminExists) {
            LocalDateTime now = timeProvider.now();
            String username = adminEmail.toLowerCase();

            User admin = User.builder()
                    .username(username)
                    .password(passwordEncoder.encode(adminPassword))
                    .role(Role.ADMIN)
                    .enabled(true)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();

            userRepository.save(admin);
            log.warn("Default admin created with email: {}. Change the password immediately!", username);
        }
    }

    private void seedDepartmentsAndDesignations() {
        if (departmentRepository.count() > 0) {
            return;
        }

        LocalDateTime now = timeProvider.now();

        // Seed departments
        Department qc = createDepartment("Quality Control", "QC", "Quality Control Department", now);
        Department rd = createDepartment("Research & Development", "RD", "Research and Development Department", now);
        Department prod = createDepartment("Production", "PROD", "Production Department", now);
        Department hr = createDepartment("Human Resources", "HR", "Human Resources Department", now);
        Department sm = createDepartment("Sales & Marketing", "SM", "Sales and Marketing Department", now);

        List<Department> departments = departmentRepository.saveAll(List.of(qc, rd, prod, hr, sm));
        log.info("Seeded {} departments", departments.size());

        // Retrieve saved departments to get their IDs
        String qcId = departments.stream().filter(d -> "QC".equals(d.getCode())).findFirst().map(Department::getId).orElse(null);
        String rdId = departments.stream().filter(d -> "RD".equals(d.getCode())).findFirst().map(Department::getId).orElse(null);
        String prodId = departments.stream().filter(d -> "PROD".equals(d.getCode())).findFirst().map(Department::getId).orElse(null);

        // Seed designations — shared (no department)
        Designation manager = createDesignation("Manager", "Managerial role", null, now);
        Designation teamLead = createDesignation("Team Lead", "Team leadership role", null, now);
        Designation executive = createDesignation("Executive", "Executive role", null, now);
        Designation analyst = createDesignation("Analyst", "Analytical role", null, now);

        // Seed designations — department-specific
        Designation qualityAnalyst = createDesignation("Quality Analyst", "Quality analysis specialist", qcId, now);
        Designation researchScientist = createDesignation("Research Scientist", "Research and development scientist", rdId, now);
        Designation productionSupervisor = createDesignation("Production Supervisor", "Production line supervisor", prodId, now);

        List<Designation> designations = designationRepository.saveAll(
                List.of(manager, teamLead, executive, analyst, qualityAnalyst, researchScientist, productionSupervisor));
        log.info("Seeded {} designations", designations.size());
    }

    private Department createDepartment(String name, String code, String description, LocalDateTime now) {
        return Department.builder()
                .name(name)
                .code(code)
                .description(description)
                .active(true)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    private Designation createDesignation(String title, String description, String departmentId, LocalDateTime now) {
        return Designation.builder()
                .title(title)
                .description(description)
                .departmentId(departmentId)
                .active(true)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }
}
