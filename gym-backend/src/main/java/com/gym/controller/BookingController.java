package com.gym.controller;

import com.gym.dto.BookingRequest;
import com.gym.entity.Booking;
import com.gym.entity.GymClass;
import com.gym.enums.BookingStatus;
import com.gym.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // Classes
    @GetMapping("/classes")
    public List<GymClass> getAllClasses(@RequestParam(required = false) Boolean upcoming) {
        return Boolean.TRUE.equals(upcoming) ? bookingService.getUpcomingClasses() : bookingService.getAllClasses();
    }

    @GetMapping("/classes/{id}")
    public ResponseEntity<GymClass> getClassById(@PathVariable UUID id) {
        return ResponseEntity.ok(bookingService.getClassById(id));
    }

    @PostMapping("/classes")
    public ResponseEntity<GymClass> createClass(@RequestBody GymClass gymClass,
                                                 @RequestParam(required = false) UUID trainerId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createClass(gymClass, trainerId));
    }

    @PutMapping("/classes/{id}")
    public ResponseEntity<GymClass> updateClass(@PathVariable UUID id, @RequestBody GymClass gymClass) {
        return ResponseEntity.ok(bookingService.updateClass(id, gymClass));
    }

    @DeleteMapping("/classes/{id}")
    public ResponseEntity<Void> deleteClass(@PathVariable UUID id) {
        bookingService.deleteClass(id);
        return ResponseEntity.noContent().build();
    }

    // Bookings
    @GetMapping("/bookings")
    public List<Booking> getAllBookings() {
        return bookingService.getAllBookings();
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable UUID id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    @GetMapping("/users/{userId}/bookings")
    public List<Booking> getBookingsByUser(@PathVariable UUID userId) {
        return bookingService.getBookingsByUser(userId);
    }

    @PostMapping("/bookings")
    public ResponseEntity<Booking> createBooking(@RequestBody BookingRequest request) {
        Booking booking = new Booking();
        booking.setBookingType(request.getBookingType());
        booking.setScheduledAt(request.getScheduledAt());
        booking.setDurationMinutes(request.getDurationMinutes() > 0 ? request.getDurationMinutes() : 60);
        booking.setNotes(request.getNotes());
        if (request.getClassId() != null) {
            GymClass gc = new GymClass();
            gc.setId(request.getClassId());
            booking.setGymClass(gc);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(request.getUserId(), booking));
    }

    @PatchMapping("/bookings/{id}/status")
    public ResponseEntity<Booking> updateStatus(@PathVariable UUID id,
                                                 @RequestParam String status,
                                                 @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(bookingService.updateBookingStatus(id,
                BookingStatus.valueOf(status.toUpperCase()), reason));
    }

    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable UUID id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.noContent().build();
    }
}
