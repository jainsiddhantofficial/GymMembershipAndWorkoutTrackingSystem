package com.gym.repository;

import com.gym.entity.Booking;
import com.gym.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {
    List<Booking> findByUserId(UUID userId);
    List<Booking> findByUserIdAndStatus(UUID userId, BookingStatus status);
    List<Booking> findByTrainerId(UUID trainerId);
    List<Booking> findByGymClassId(UUID classId);
    List<Booking> findByStatus(BookingStatus status);
}
