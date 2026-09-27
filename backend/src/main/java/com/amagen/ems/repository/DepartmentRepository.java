package com.amagen.ems.repository;

import com.amagen.ems.model.Department;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends MongoRepository<Department, String> {

    Optional<Department> findByNameIgnoreCase(String name);

    Optional<Department> findByCodeIgnoreCase(String code);

    boolean existsByNameIgnoreCaseAndIdNot(String name, String id);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, String id);

    List<Department> findByActive(boolean active);
}
