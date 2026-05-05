package com.gym.service;

import com.gym.entity.Payment;
import com.gym.entity.User;
import com.gym.enums.PaymentStatus;
import com.gym.repository.PaymentRepository;
import com.gym.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;

    public List<Payment> getAllPayments() { return paymentRepository.findAll(); }

    public List<Payment> getPaymentsByUser(UUID userId) {
        return paymentRepository.findByUserId(userId);
    }

    public Payment getPaymentById(UUID id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + id));
    }

    public Payment createPayment(UUID userId, Payment payment) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        payment.setUser(user);
        if (payment.getStatus() == PaymentStatus.COMPLETED && payment.getPaidAt() == null) {
            payment.setPaidAt(LocalDateTime.now());
        }
        return paymentRepository.save(payment);
    }

    public Payment updatePaymentStatus(UUID id, PaymentStatus status) {
        Payment payment = getPaymentById(id);
        payment.setStatus(status);
        if (status == PaymentStatus.COMPLETED && payment.getPaidAt() == null) {
            payment.setPaidAt(LocalDateTime.now());
        }
        return paymentRepository.save(payment);
    }

    public void deletePayment(UUID id) { paymentRepository.deleteById(id); }

    public BigDecimal getTodayRevenue() {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        return paymentRepository.sumRevenueByDateRange(start, end);
    }

    public BigDecimal getTotalRevenue() {
        return paymentRepository.sumTotalRevenue();
    }

    public BigDecimal getMonthlyRevenue() {
        LocalDateTime start = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime end = LocalDateTime.now();
        return paymentRepository.sumRevenueByDateRange(start, end);
    }
}
