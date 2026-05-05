package com.gym.repository;

import com.gym.entity.DietPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DietPlanRepository extends JpaRepository<DietPlan, UUID> {
    List<DietPlan> findByMemberId(UUID memberId);
    List<DietPlan> findByTrainerId(UUID trainerId);
    List<DietPlan> findByMemberIdAndIsActiveTrue(UUID memberId);
}
