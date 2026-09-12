package com.amagen.ems.repository;

import com.amagen.ems.model.User;
import com.amagen.ems.model.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    Optional<User> findByEmployeeId(String employeeId);

    Page<User> findByRoleAndUsernameContainingIgnoreCase(Role role, String search, Pageable pageable);

    Page<User> findByRole(Role role, Pageable pageable);

    Page<User> findByUsernameContainingIgnoreCase(String search, Pageable pageable);

    long countByRoleAndEnabled(Role role, boolean enabled);
}
