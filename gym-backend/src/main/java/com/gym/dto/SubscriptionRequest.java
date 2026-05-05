package com.gym.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class SubscriptionRequest {
    private UUID userId;
    private UUID planId;
    private LocalDateTime startDate;
    private boolean autoRenew;
    private String notes;
}
