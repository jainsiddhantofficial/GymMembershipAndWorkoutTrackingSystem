package com.gym.controller;

import com.gym.entity.Payment;
import com.gym.enums.PaymentStatus;
import com.gym.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    public List<Payment> getAllPayments(@RequestParam(required = false) String status) {
        if (status != null) {
            return paymentService.getPaymentsByUser(null);
        }
        return paymentService.getAllPayments();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPaymentById(@PathVariable UUID id) {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    @GetMapping("/user/{userId}")
    public List<Payment> getPaymentsByUser(@PathVariable UUID userId) {
        return paymentService.getPaymentsByUser(userId);
    }

    @PostMapping("/user/{userId}")
    public ResponseEntity<Payment> createPayment(@PathVariable UUID userId, @RequestBody Payment payment) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.createPayment(userId, payment));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Payment> updateStatus(@PathVariable UUID id, @RequestParam String status) {
        return ResponseEntity.ok(paymentService.updatePaymentStatus(id, PaymentStatus.valueOf(status.toUpperCase())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable UUID id) {
        paymentService.deletePayment(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/revenue")
    public ResponseEntity<Map<String, BigDecimal>> getRevenue() {
        return ResponseEntity.ok(Map.of(
                "today", paymentService.getTodayRevenue(),
                "monthly", paymentService.getMonthlyRevenue(),
                "total", paymentService.getTotalRevenue()
        ));
    }
}
