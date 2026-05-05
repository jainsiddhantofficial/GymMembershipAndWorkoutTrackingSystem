package com.gym.controller;

import com.gym.entity.Attendance;
import com.gym.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping
    public List<Attendance> getAllAttendance() {
        return attendanceService.getAllAttendance();
    }

    @GetMapping("/today")
    public List<Attendance> getTodayAttendance() {
        return attendanceService.getTodayAttendance();
    }

    @GetMapping("/user/{userId}")
    public List<Attendance> getByUser(@PathVariable UUID userId) {
        return attendanceService.getAttendanceByUser(userId);
    }

    @GetMapping("/range")
    public List<Attendance> getByRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return attendanceService.getAttendanceByDateRange(start, end);
    }

    @PostMapping("/check-in/{userId}")
    public ResponseEntity<Attendance> checkIn(@PathVariable UUID userId,
                                               @RequestParam(required = false) String method) {
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceService.checkIn(userId, method));
    }

    @PostMapping("/qr-check-in")
    public ResponseEntity<Attendance> qrCheckIn(@RequestParam String qrCode) {
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceService.checkInByQr(qrCode));
    }

    @PatchMapping("/{id}/check-out")
    public ResponseEntity<Attendance> checkOut(@PathVariable UUID id) {
        return ResponseEntity.ok(attendanceService.checkOut(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        attendanceService.deleteAttendance(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(Map.of("todayCount", attendanceService.getTodayCount()));
    }
}
