package com.gym.repository;

import com.gym.entity.MaintenanceLog;
import com.gym.enums.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MaintenanceLogRepository extends JpaRepository<MaintenanceLog, UUID> {
    List<MaintenanceLog> findByEquipmentId(UUID equipmentId);
    List<MaintenanceLog> findByStatus(MaintenanceStatus status);
    List<MaintenanceLog> findByAssignedToId(UUID userId);
}
