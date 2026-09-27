package com.amagen.ems.repository;

import com.amagen.ems.model.Designation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DesignationRepository extends MongoRepository<Designation, String> {

    Optional<Designation> findByTitleIgnoreCase(String title);

    boolean existsByTitleIgnoreCaseAndIdNot(String title, String id);

    List<Designation> findByActive(boolean active);

    List<Designation> findByDepartmentIdAndActive(String departmentId, boolean active);

    List<Designation> findByDepartmentIdIsNullAndActive(boolean active);

    long countByDepartmentId(String departmentId);
}
