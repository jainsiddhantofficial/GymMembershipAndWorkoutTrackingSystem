package com.gym.controller;

import com.gym.entity.Equipment;
import com.gym.entity.MaintenanceLog;
import com.gym.enums.EquipmentStatus;
import com.gym.enums.MaintenanceStatus;
import com.gym.service.EquipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentService equipmentService;

    @GetMapping("/equipment")
    public List<Equipment> getAllEquipment(@RequestParam(required = false) String status) {
        if (status != null) {
            return equipmentService.getEquipmentByStatus(EquipmentStatus.valueOf(status.toUpperCase()));
        }
        return equipmentService.getAllEquipment();
    }

    @GetMapping("/equipment/{id}")
    public ResponseEntity<Equipment> getEquipmentById(@PathVariable UUID id) {
        return ResponseEntity.ok(equipmentService.getEquipmentById(id));
    }

    @PostMapping("/equipment")
    public ResponseEntity<Equipment> createEquipment(@RequestBody Equipment equipment) {
        return ResponseEntity.status(HttpStatus.CREATED).body(equipmentService.createEquipment(equipment));
    }

    @PutMapping("/equipment/{id}")
    public ResponseEntity<Equipment> updateEquipment(@PathVariable UUID id, @RequestBody Equipment equipment) {
        return ResponseEntity.ok(equipmentService.updateEquipment(id, equipment));
    }

    @DeleteMapping("/equipment/{id}")
    public ResponseEntity<Void> deleteEquipment(@PathVariable UUID id) {
        equipmentService.deleteEquipment(id);
        return ResponseEntity.noContent().build();
    }

    // Maintenance
    @GetMapping("/maintenance")
    public List<MaintenanceLog> getAllMaintenance(@RequestParam(required = false) String status) {
        if (status != null) {
            return equipmentService.getMaintenanceLogsByStatus(MaintenanceStatus.valueOf(status.toUpperCase()));
        }
        return equipmentService.getAllMaintenanceLogs();
    }

    @GetMapping("/maintenance/{id}")
    public ResponseEntity<MaintenanceLog> getMaintenanceById(@PathVariable UUID id) {
        return ResponseEntity.ok(equipmentService.getMaintenanceLogById(id));
    }

    @GetMapping("/equipment/{equipmentId}/maintenance")
    public List<MaintenanceLog> getMaintenanceByEquipment(@PathVariable UUID equipmentId) {
        return equipmentService.getMaintenanceLogsByEquipment(equipmentId);
    }

    @PostMapping("/equipment/{equipmentId}/maintenance")
    public ResponseEntity<MaintenanceLog> createMaintenanceLog(@PathVariable UUID equipmentId,
                                                                @RequestBody MaintenanceLog log,
                                                                @RequestParam(required = false) UUID assignedTo) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(equipmentService.createMaintenanceLog(equipmentId, log, assignedTo));
    }

    @PutMapping("/maintenance/{id}")
    public ResponseEntity<MaintenanceLog> updateMaintenanceLog(@PathVariable UUID id,
                                                                @RequestBody MaintenanceLog log) {
        return ResponseEntity.ok(equipmentService.updateMaintenanceLog(id, log));
    }

    @DeleteMapping("/maintenance/{id}")
    public ResponseEntity<Void> deleteMaintenanceLog(@PathVariable UUID id) {
        equipmentService.deleteMaintenanceLog(id);
        return ResponseEntity.noContent().build();
    }
}
