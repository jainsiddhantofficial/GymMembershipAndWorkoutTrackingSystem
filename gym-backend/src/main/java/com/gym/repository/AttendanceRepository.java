package com.gym.repository;

import com.gym.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {
    List<Attendance> findByUserIdOrderByCheckInAtDesc(UUID userId);
    List<Attendance> findByCheckInAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.checkInAt BETWEEN :start AND :end")
    long countByDate(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(DISTINCT a.user.id) FROM Attendance a WHERE a.checkInAt BETWEEN :start AND :end")
    long countUniqueVisitorsByDate(LocalDateTime start, LocalDateTime end);
}
