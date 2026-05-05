package com.gym.dto;

import com.gym.enums.BookingType;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class BookingRequest {
    private UUID userId;
    private UUID classId;
    private UUID trainerId;
    private BookingType bookingType;
    private LocalDateTime scheduledAt;
    private int durationMinutes;
    private String notes;
}
