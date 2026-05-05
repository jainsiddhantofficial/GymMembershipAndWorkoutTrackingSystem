package com.gym.service;

import com.gym.entity.Attendance;
import com.gym.entity.User;
import com.gym.repository.AttendanceRepository;
import com.gym.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;

    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }

    public List<Attendance> getAttendanceByUser(UUID userId) {
        return attendanceRepository.findByUserIdOrderByCheckInAtDesc(userId);
    }

    public List<Attendance> getTodayAttendance() {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        return attendanceRepository.findByCheckInAtBetween(start, end);
    }

    public List<Attendance> getAttendanceByDateRange(LocalDateTime start, LocalDateTime end) {
        return attendanceRepository.findByCheckInAtBetween(start, end);
    }

    public Attendance checkIn(UUID userId, String method) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        Attendance attendance = Attendance.builder()
                .user(user)
                .checkInAt(LocalDateTime.now())
                .method(method != null ? method : "MANUAL")
                .build();
        return attendanceRepository.save(attendance);
    }

    public Attendance checkInByQr(String qrCode) {
        User user = userRepository.findAll().stream()
                .filter(u -> qrCode.equals(u.getQrCode()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Invalid QR code"));
        return checkIn(user.getId(), "QR_CODE");
    }

    public Attendance checkOut(UUID attendanceId) {
        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new RuntimeException("Attendance not found: " + attendanceId));
        attendance.setCheckOutAt(LocalDateTime.now());
        return attendanceRepository.save(attendance);
    }

    public void deleteAttendance(UUID id) {
        attendanceRepository.deleteById(id);
    }

    public long getTodayCount() {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        return attendanceRepository.countByDate(start, end);
    }
}
