package com.gym.service;

import com.gym.enums.MembershipStatus;
import com.gym.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final AttendanceRepository attendanceRepository;
    private final PaymentRepository paymentRepository;

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // Members
        long totalMembers = userRepository.findByRoleAndIsActiveTrue(com.gym.enums.UserRole.MEMBER).size();
        long activeSubscriptions = subscriptionRepository.countByStatus(MembershipStatus.ACTIVE);
        long expiringSoon = subscriptionRepository.findExpiringSoon(
                LocalDateTime.now(), LocalDateTime.now().plusDays(7)).size();

        // Attendance today
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);
        long todayAttendance = attendanceRepository.countByDate(todayStart, todayEnd);

        // Revenue
        BigDecimal todayRevenue = paymentRepository.sumRevenueByDateRange(todayStart, todayEnd);
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        BigDecimal monthlyRevenue = paymentRepository.sumRevenueByDateRange(monthStart, LocalDateTime.now());
        BigDecimal totalRevenue = paymentRepository.sumTotalRevenue();

        stats.put("totalMembers", totalMembers);
        stats.put("activeSubscriptions", activeSubscriptions);
        stats.put("expiringSoon", expiringSoon);
        stats.put("todayAttendance", todayAttendance);
        stats.put("todayRevenue", todayRevenue);
        stats.put("monthlyRevenue", monthlyRevenue);
        stats.put("totalRevenue", totalRevenue);

        return stats;
    }
}
