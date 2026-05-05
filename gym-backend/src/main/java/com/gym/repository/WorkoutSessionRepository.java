package com.gym.repository;

import com.gym.entity.WorkoutSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, UUID> {
    List<WorkoutSession> findByUserIdOrderByDateDesc(UUID userId);
    List<WorkoutSession> findByUserIdAndDateBetween(UUID userId, LocalDateTime start, LocalDateTime end);
}
