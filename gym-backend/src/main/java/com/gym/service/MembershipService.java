package com.gym.service;

import com.gym.entity.MembershipPlan;
import com.gym.entity.Subscription;
import com.gym.entity.User;
import com.gym.enums.MembershipStatus;
import com.gym.repository.MembershipPlanRepository;
import com.gym.repository.SubscriptionRepository;
import com.gym.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class MembershipService {

    private final MembershipPlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    // Plans
    public List<MembershipPlan> getAllPlans() { return planRepository.findAll(); }
    public List<MembershipPlan> getActivePlans() { return planRepository.findByIsActiveTrue(); }

    public MembershipPlan getPlanById(UUID id) {
        return planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found: " + id));
    }

    public MembershipPlan createPlan(MembershipPlan plan) {
        return planRepository.save(plan);
    }

    public MembershipPlan updatePlan(UUID id, MembershipPlan updated) {
        MembershipPlan existing = getPlanById(id);
        if (updated.getName() != null) existing.setName(updated.getName());
        if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
        if (updated.getDurationDays() > 0) existing.setDurationDays(updated.getDurationDays());
        if (updated.getPrice() != null) existing.setPrice(updated.getPrice());
        if (updated.getFeatures() != null) existing.setFeatures(updated.getFeatures());
        existing.setMaxFreezeDays(updated.getMaxFreezeDays());
        return planRepository.save(existing);
    }

    public void deletePlan(UUID id) {
        planRepository.deleteById(id);
    }

    // Subscriptions
    public List<Subscription> getAllSubscriptions() { return subscriptionRepository.findAll(); }

    public List<Subscription> getSubscriptionsByUser(UUID userId) {
        return subscriptionRepository.findByUserId(userId);
    }

    public List<Subscription> getSubscriptionsByStatus(MembershipStatus status) {
        return subscriptionRepository.findByStatus(status);
    }

    public List<Subscription> getExpiringSoon() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime soon = now.plusDays(7);
        return subscriptionRepository.findExpiringSoon(now, soon);
    }

    public Subscription getSubscriptionById(UUID id) {
        return subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subscription not found: " + id));
    }

    public Subscription createSubscription(UUID userId, UUID planId, Subscription sub) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        MembershipPlan plan = getPlanById(planId);

        LocalDateTime start = sub.getStartDate() != null ? sub.getStartDate() : LocalDateTime.now();
        LocalDateTime end = start.plusDays(plan.getDurationDays());

        Subscription newSub = Subscription.builder()
                .user(user)
                .plan(plan)
                .status(MembershipStatus.ACTIVE)
                .startDate(start)
                .endDate(end)
                .autoRenew(sub.isAutoRenew())
                .notes(sub.getNotes())
                .build();

        return subscriptionRepository.save(newSub);
    }

    public Subscription updateSubscriptionStatus(UUID id, MembershipStatus status) {
        Subscription sub = getSubscriptionById(id);
        sub.setStatus(status);
        return subscriptionRepository.save(sub);
    }

    public Subscription freezeSubscription(UUID id) {
        Subscription sub = getSubscriptionById(id);
        sub.setStatus(MembershipStatus.FROZEN);
        sub.setFreezeStartDate(LocalDateTime.now());
        return subscriptionRepository.save(sub);
    }

    public Subscription unfreezeSubscription(UUID id) {
        Subscription sub = getSubscriptionById(id);
        if (sub.getFreezeStartDate() != null) {
            long frozenDays = java.time.Duration.between(sub.getFreezeStartDate(), LocalDateTime.now()).toDays();
            sub.setFrozenDaysUsed(sub.getFrozenDaysUsed() + (int) frozenDays);
            sub.setEndDate(sub.getEndDate().plusDays(frozenDays));
        }
        sub.setStatus(MembershipStatus.ACTIVE);
        sub.setFreezeEndDate(LocalDateTime.now());
        return subscriptionRepository.save(sub);
    }

    public void deleteSubscription(UUID id) {
        subscriptionRepository.deleteById(id);
    }

    public long countActiveSubscriptions() {
        return subscriptionRepository.countByStatus(MembershipStatus.ACTIVE);
    }
}
