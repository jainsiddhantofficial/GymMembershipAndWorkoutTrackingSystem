package com.gym.controller;

import com.gym.dto.SubscriptionRequest;
import com.gym.entity.MembershipPlan;
import com.gym.entity.Subscription;
import com.gym.enums.MembershipStatus;
import com.gym.service.MembershipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class MembershipController {

    private final MembershipService membershipService;

    // Plans
    @GetMapping("/plans")
    public List<MembershipPlan> getAllPlans(@RequestParam(required = false) Boolean active) {
        return Boolean.TRUE.equals(active) ? membershipService.getActivePlans() : membershipService.getAllPlans();
    }

    @GetMapping("/plans/{id}")
    public ResponseEntity<MembershipPlan> getPlanById(@PathVariable UUID id) {
        return ResponseEntity.ok(membershipService.getPlanById(id));
    }

    @PostMapping("/plans")
    public ResponseEntity<MembershipPlan> createPlan(@RequestBody MembershipPlan plan) {
        return ResponseEntity.status(HttpStatus.CREATED).body(membershipService.createPlan(plan));
    }

    @PutMapping("/plans/{id}")
    public ResponseEntity<MembershipPlan> updatePlan(@PathVariable UUID id, @RequestBody MembershipPlan plan) {
        return ResponseEntity.ok(membershipService.updatePlan(id, plan));
    }

    @DeleteMapping("/plans/{id}")
    public ResponseEntity<Void> deletePlan(@PathVariable UUID id) {
        membershipService.deletePlan(id);
        return ResponseEntity.noContent().build();
    }

    // Subscriptions
    @GetMapping("/subscriptions")
    public List<Subscription> getAllSubscriptions(@RequestParam(required = false) String status) {
        if (status != null) {
            return membershipService.getSubscriptionsByStatus(MembershipStatus.valueOf(status.toUpperCase()));
        }
        return membershipService.getAllSubscriptions();
    }

    @GetMapping("/subscriptions/expiring-soon")
    public List<Subscription> getExpiringSoon() {
        return membershipService.getExpiringSoon();
    }

    @GetMapping("/subscriptions/{id}")
    public ResponseEntity<Subscription> getSubscriptionById(@PathVariable UUID id) {
        return ResponseEntity.ok(membershipService.getSubscriptionById(id));
    }

    @GetMapping("/users/{userId}/subscriptions")
    public List<Subscription> getSubscriptionsByUser(@PathVariable UUID userId) {
        return membershipService.getSubscriptionsByUser(userId);
    }

    @PostMapping("/subscriptions")
    public ResponseEntity<Subscription> createSubscription(@RequestBody SubscriptionRequest request) {
        Subscription sub = new Subscription();
        sub.setStartDate(request.getStartDate());
        sub.setAutoRenew(request.isAutoRenew());
        sub.setNotes(request.getNotes());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(membershipService.createSubscription(request.getUserId(), request.getPlanId(), sub));
    }

    @PatchMapping("/subscriptions/{id}/status")
    public ResponseEntity<Subscription> updateStatus(@PathVariable UUID id,
                                                      @RequestParam String status) {
        return ResponseEntity.ok(membershipService.updateSubscriptionStatus(id,
                MembershipStatus.valueOf(status.toUpperCase())));
    }

    @PatchMapping("/subscriptions/{id}/freeze")
    public ResponseEntity<Subscription> freeze(@PathVariable UUID id) {
        return ResponseEntity.ok(membershipService.freezeSubscription(id));
    }

    @PatchMapping("/subscriptions/{id}/unfreeze")
    public ResponseEntity<Subscription> unfreeze(@PathVariable UUID id) {
        return ResponseEntity.ok(membershipService.unfreezeSubscription(id));
    }

    @DeleteMapping("/subscriptions/{id}")
    public ResponseEntity<Void> deleteSubscription(@PathVariable UUID id) {
        membershipService.deleteSubscription(id);
        return ResponseEntity.noContent().build();
    }
}
