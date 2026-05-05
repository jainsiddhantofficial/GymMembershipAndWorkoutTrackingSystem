package com.gym.service;

import com.gym.entity.Booking;
import com.gym.entity.GymClass;
import com.gym.entity.User;
import com.gym.enums.BookingStatus;
import com.gym.enums.BookingType;
import com.gym.repository.BookingRepository;
import com.gym.repository.GymClassRepository;
import com.gym.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingService {

    private final BookingRepository bookingRepository;
    private final GymClassRepository classRepository;
    private final UserRepository userRepository;

    // Classes
    public List<GymClass> getAllClasses() { return classRepository.findAll(); }
    public List<GymClass> getUpcomingClasses() { return classRepository.findByIsActiveTrueOrderByScheduledAtAsc(); }

    public GymClass getClassById(UUID id) {
        return classRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found: " + id));
    }

    public GymClass createClass(GymClass gymClass, UUID trainerId) {
        if (trainerId != null) {
            User trainer = userRepository.findById(trainerId)
                    .orElseThrow(() -> new RuntimeException("Trainer not found: " + trainerId));
            gymClass.setTrainer(trainer);
        }
        return classRepository.save(gymClass);
    }

    public GymClass updateClass(UUID id, GymClass updated) {
        GymClass existing = getClassById(id);
        if (updated.getName() != null) existing.setName(updated.getName());
        if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
        if (updated.getScheduledAt() != null) existing.setScheduledAt(updated.getScheduledAt());
        if (updated.getDurationMinutes() > 0) existing.setDurationMinutes(updated.getDurationMinutes());
        if (updated.getMaxCapacity() > 0) existing.setMaxCapacity(updated.getMaxCapacity());
        if (updated.getLocation() != null) existing.setLocation(updated.getLocation());
        return classRepository.save(existing);
    }

    public void deleteClass(UUID id) { classRepository.deleteById(id); }

    // Bookings
    public List<Booking> getAllBookings() { return bookingRepository.findAll(); }

    public List<Booking> getBookingsByUser(UUID userId) {
        return bookingRepository.findByUserId(userId);
    }

    public Booking getBookingById(UUID id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + id));
    }

    public Booking createBooking(UUID userId, Booking booking) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        booking.setUser(user);
        booking.setStatus(BookingStatus.CONFIRMED);

        if (booking.getBookingType() == BookingType.GROUP_CLASS && booking.getGymClass() != null) {
            GymClass gymClass = getClassById(booking.getGymClass().getId());
            if (gymClass.getCurrentEnrollment() >= gymClass.getMaxCapacity()) {
                throw new RuntimeException("Class is full");
            }
            gymClass.setCurrentEnrollment(gymClass.getCurrentEnrollment() + 1);
            classRepository.save(gymClass);
            booking.setGymClass(gymClass);
        }

        return bookingRepository.save(booking);
    }

    public Booking updateBookingStatus(UUID id, BookingStatus status, String reason) {
        Booking booking = getBookingById(id);
        BookingStatus oldStatus = booking.getStatus();
        booking.setStatus(status);
        if (reason != null) booking.setCancellationReason(reason);

        if (status == BookingStatus.CANCELLED && oldStatus == BookingStatus.CONFIRMED
                && booking.getGymClass() != null) {
            GymClass gymClass = booking.getGymClass();
            gymClass.setCurrentEnrollment(Math.max(0, gymClass.getCurrentEnrollment() - 1));
            classRepository.save(gymClass);
        }

        return bookingRepository.save(booking);
    }

    public void deleteBooking(UUID id) { bookingRepository.deleteById(id); }
}
