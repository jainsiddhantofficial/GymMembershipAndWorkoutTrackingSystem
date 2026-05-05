package com.gym.controller;

import com.gym.entity.DietPlan;
import com.gym.entity.Meal;
import com.gym.service.DietService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/diet-plans")
@RequiredArgsConstructor
public class DietController {

    private final DietService dietService;

    @GetMapping
    public List<DietPlan> getAllDietPlans() {
        return dietService.getAllDietPlans();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DietPlan> getDietPlanById(@PathVariable UUID id) {
        return ResponseEntity.ok(dietService.getDietPlanById(id));
    }

    @GetMapping("/member/{memberId}")
    public List<DietPlan> getDietPlansByMember(@PathVariable UUID memberId,
                                                @RequestParam(required = false) Boolean active) {
        return Boolean.TRUE.equals(active)
                ? dietService.getActiveDietPlansByMember(memberId)
                : dietService.getDietPlansByMember(memberId);
    }

    @GetMapping("/trainer/{trainerId}")
    public List<DietPlan> getDietPlansByTrainer(@PathVariable UUID trainerId) {
        return dietService.getDietPlansByTrainer(trainerId);
    }

    @PostMapping
    public ResponseEntity<DietPlan> createDietPlan(@RequestBody DietPlan plan,
                                                    @RequestParam(required = false) UUID memberId,
                                                    @RequestParam(required = false) UUID trainerId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(dietService.createDietPlan(plan, memberId, trainerId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DietPlan> updateDietPlan(@PathVariable UUID id, @RequestBody DietPlan plan) {
        return ResponseEntity.ok(dietService.updateDietPlan(id, plan));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDietPlan(@PathVariable UUID id) {
        dietService.deleteDietPlan(id);
        return ResponseEntity.noContent().build();
    }

    // Meals
    @GetMapping("/{dietPlanId}/meals")
    public List<Meal> getMealsByDietPlan(@PathVariable UUID dietPlanId) {
        return dietService.getMealsByDietPlan(dietPlanId);
    }

    @PostMapping("/{dietPlanId}/meals")
    public ResponseEntity<Meal> addMeal(@PathVariable UUID dietPlanId, @RequestBody Meal meal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(dietService.addMeal(dietPlanId, meal));
    }

    @PutMapping("/meals/{id}")
    public ResponseEntity<Meal> updateMeal(@PathVariable UUID id, @RequestBody Meal meal) {
        return ResponseEntity.ok(dietService.updateMeal(id, meal));
    }

    @DeleteMapping("/meals/{id}")
    public ResponseEntity<Void> deleteMeal(@PathVariable UUID id) {
        dietService.deleteMeal(id);
        return ResponseEntity.noContent().build();
    }
}
