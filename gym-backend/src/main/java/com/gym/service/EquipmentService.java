package com.gym.service;

import com.gym.entity.Equipment;
import com.gym.entity.MaintenanceLog;
import com.gym.entity.User;
import com.gym.enums.EquipmentStatus;
import com.gym.enums.MaintenanceStatus;
import com.gym.repository.EquipmentRepository;
import com.gym.repository.MaintenanceLogRepository;
import com.gym.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final MaintenanceLogRepository maintenanceLogRepository;
    private final UserRepository userRepository;

    public List<Equipment> getAllEquipment() { return equipmentRepository.findAll(); }

    public List<Equipment> getEquipmentByStatus(EquipmentStatus status) {
        return equipmentRepository.findByStatus(status);
    }

    public Equipment getEquipmentById(UUID id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipment not found: " + id));
    }

    public Equipment createEquipment(Equipment equipment) { return equipmentRepository.save(equipment); }

    public Equipment updateEquipment(UUID id, Equipment updated) {
        Equipment existing = getEquipmentById(id);
        if (updated.getName() != null) existing.setName(updated.getName());
        if (updated.getCategory() != null) existing.setCategory(updated.getCategory());
        if (updated.getSerialNumber() != null) existing.setSerialNumber(updated.getSerialNumber());
        if (updated.getStatus() != null) existing.setStatus(updated.getStatus());
        if (updated.getLocation() != null) existing.setLocation(updated.getLocation());
        if (updated.getNotes() != null) existing.setNotes(updated.getNotes());
        if (updated.getPurchaseDate() != null) existing.setPurchaseDate(updated.getPurchaseDate());
        if (updated.getWarrantyExpiry() != null) existing.setWarrantyExpiry(updated.getWarrantyExpiry());
        return equipmentRepository.save(existing);
    }

    public void deleteEquipment(UUID id) { equipmentRepository.deleteById(id); }

    // Maintenance
    public List<MaintenanceLog> getAllMaintenanceLogs() { return maintenanceLogRepository.findAll(); }

    public List<MaintenanceLog> getMaintenanceLogsByEquipment(UUID equipmentId) {
        return maintenanceLogRepository.findByEquipmentId(equipmentId);
    }

    public List<MaintenanceLog> getMaintenanceLogsByStatus(MaintenanceStatus status) {
        return maintenanceLogRepository.findByStatus(status);
    }

    public MaintenanceLog getMaintenanceLogById(UUID id) {
        return maintenanceLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance log not found: " + id));
    }

    public MaintenanceLog createMaintenanceLog(UUID equipmentId, MaintenanceLog log, UUID assignedToId) {
        Equipment equipment = getEquipmentById(equipmentId);
        log.setEquipment(equipment);
        if (assignedToId != null) {
            User assignedTo = userRepository.findById(assignedToId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + assignedToId));
            log.setAssignedTo(assignedTo);
        }
        equipment.setStatus(EquipmentStatus.MAINTENANCE);
        equipmentRepository.save(equipment);
        return maintenanceLogRepository.save(log);
    }

    public MaintenanceLog updateMaintenanceLog(UUID id, MaintenanceLog updated) {
        MaintenanceLog existing = getMaintenanceLogById(id);
        if (updated.getStatus() != null) existing.setStatus(updated.getStatus());
        if (updated.getResolution() != null) existing.setResolution(updated.getResolution());
        if (updated.getPriority() != null) existing.setPriority(updated.getPriority());
        if (updated.getScheduledAt() != null) existing.setScheduledAt(updated.getScheduledAt());
        if (updated.getCompletedAt() != null) {
            existing.setCompletedAt(updated.getCompletedAt());
            if (updated.getStatus() == MaintenanceStatus.COMPLETED) {
                existing.getEquipment().setStatus(EquipmentStatus.OPERATIONAL);
                equipmentRepository.save(existing.getEquipment());
            }
        }
        return maintenanceLogRepository.save(existing);
    }

    public void deleteMaintenanceLog(UUID id) { maintenanceLogRepository.deleteById(id); }
}
