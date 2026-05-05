package com.gym.repository;

import com.gym.entity.Subscription;
import com.gym.entity.User;
import com.gym.enums.MembershipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
    List<Subscription> findByUser(User user);
    List<Subscription> findByUserId(UUID userId);
    List<Subscription> findByStatus(MembershipStatus status);
    Optional<Subscription> findTopByUserIdAndStatusOrderByEndDateDesc(UUID userId, MembershipStatus status);

    @Query("SELECT s FROM Subscription s WHERE s.endDate BETWEEN :now AND :soon AND s.status = 'ACTIVE'")
    List<Subscription> findExpiringSoon(LocalDateTime now, LocalDateTime soon);

    long countByStatus(MembershipStatus status);
}
