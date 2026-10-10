package com.amagen.ems.repository;

import com.amagen.ems.dto.response.DepartmentEmployeeCount;
import com.amagen.ems.model.Employee;
import com.amagen.ems.model.enums.EmployeeStatus;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends MongoRepository<Employee, String> {

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    boolean existsByEmailAndIdNot(String email, String id);

    boolean existsByPhoneAndIdNot(String phone, String id);

    Optional<Employee> findByUserId(String userId);

    List<Employee> findByStatusAndDepartmentId(EmployeeStatus status, String departmentId);

    List<Employee> findByStatus(EmployeeStatus status);

    long countByDepartmentId(String departmentId);

    long countByDesignationId(String designationId);

    long countByStatus(EmployeeStatus status);

    long countByDepartmentIdAndStatus(String departmentId, EmployeeStatus status);

    List<Employee> findByDepartmentId(String departmentId);

    @Aggregation(pipeline = {
        "{ $match: { status: 'ACTIVE' } }",
        "{ $group: { _id: '$departmentId', count: { $sum: 1 } } }"
    })
    List<DepartmentEmployeeCount> countEmployeesByDepartment();

    @Aggregation(pipeline = {
        "{ $match: { status: 'ACTIVE' } }",
        "{ $group: { _id: '$designationId', count: { $sum: 1 } } }"
    })
    List<DepartmentEmployeeCount> countEmployeesByDesignation();
}
