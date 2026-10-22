package com.amagen.ems.repository;

import com.amagen.ems.model.Attendance;
import com.amagen.ems.model.enums.AttendanceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends MongoRepository<Attendance, String> {

    Optional<Attendance> findByEmployeeIdAndDate(String employeeId, LocalDate date);

    Page<Attendance> findByEmployeeId(String employeeId, Pageable pageable);

    List<Attendance> findByDateBetween(LocalDate from, LocalDate to);

    List<Attendance> findByEmployeeIdAndDateBetween(String employeeId, LocalDate from, LocalDate to);

    long countByDateAndStatus(LocalDate date, AttendanceStatus status);

    long countByDate(LocalDate date);

    long countByDateAndLate(LocalDate date, boolean late);
}
