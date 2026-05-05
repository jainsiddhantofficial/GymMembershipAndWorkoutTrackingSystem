package com.gym.repository;

import com.gym.entity.BodyMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BodyMetricRepository extends JpaRepository<BodyMetric, UUID> {
    List<BodyMetric> findByUserIdOrderByRecordedAtDesc(UUID userId);
}
