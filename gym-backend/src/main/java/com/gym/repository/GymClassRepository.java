package com.gym.repository;

import com.gym.entity.GymClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface GymClassRepository extends JpaRepository<GymClass, UUID> {
    List<GymClass> findByIsActiveTrueOrderByScheduledAtAsc();
    List<GymClass> findByScheduledAtBetween(LocalDateTime start, LocalDateTime end);
    List<GymClass> findByTrainerId(UUID trainerId);
}
