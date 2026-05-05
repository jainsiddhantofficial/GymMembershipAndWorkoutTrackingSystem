package com.gym.service;

import com.gym.entity.DietPlan;
import com.gym.entity.Meal;
import com.gym.entity.User;
import com.gym.repository.DietPlanRepository;
import com.gym.repository.MealRepository;
import com.gym.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class DietService {

    private final DietPlanRepository dietPlanRepository;
    private final MealRepository mealRepository;
    private final UserRepository userRepository;

    public List<DietPlan> getAllDietPlans() { return dietPlanRepository.findAll(); }

    public List<DietPlan> getDietPlansByMember(UUID memberId) {
        return dietPlanRepository.findByMemberId(memberId);
    }

    public List<DietPlan> getActiveDietPlansByMember(UUID memberId) {
        return dietPlanRepository.findByMemberIdAndIsActiveTrue(memberId);
    }

    public List<DietPlan> getDietPlansByTrainer(UUID trainerId) {
        return dietPlanRepository.findByTrainerId(trainerId);
    }

    public DietPlan getDietPlanById(UUID id) {
        return dietPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Diet plan not found: " + id));
    }

    public DietPlan createDietPlan(DietPlan plan, UUID memberId, UUID trainerId) {
        if (memberId != null) {
            User member = userRepository.findById(memberId)
                    .orElseThrow(() -> new RuntimeException("Member not found: " + memberId));
            plan.setMember(member);
        }
        if (trainerId != null) {
            User trainer = userRepository.findById(trainerId)
                    .orElseThrow(() -> new RuntimeException("Trainer not found: " + trainerId));
            plan.setTrainer(trainer);
        }
        return dietPlanRepository.save(plan);
    }

    public DietPlan updateDietPlan(UUID id, DietPlan updated) {
        DietPlan existing = getDietPlanById(id);
        if (updated.getName() != null) existing.setName(updated.getName());
        if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
        if (updated.getStartDate() != null) existing.setStartDate(updated.getStartDate());
        if (updated.getEndDate() != null) existing.setEndDate(updated.getEndDate());
        if (updated.getTotalCalories() != null) existing.setTotalCalories(updated.getTotalCalories());
        if (updated.getNotes() != null) existing.setNotes(updated.getNotes());
        return dietPlanRepository.save(existing);
    }

    public void deleteDietPlan(UUID id) { dietPlanRepository.deleteById(id); }

    // Meals
    public List<Meal> getMealsByDietPlan(UUID dietPlanId) {
        return mealRepository.findByDietPlanId(dietPlanId);
    }

    public Meal addMeal(UUID dietPlanId, Meal meal) {
        DietPlan plan = getDietPlanById(dietPlanId);
        meal.setDietPlan(plan);
        return mealRepository.save(meal);
    }

    public Meal updateMeal(UUID id, Meal updated) {
        Meal existing = mealRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meal not found: " + id));
        if (updated.getName() != null) existing.setName(updated.getName());
        if (updated.getMealType() != null) existing.setMealType(updated.getMealType());
        if (updated.getCalories() != null) existing.setCalories(updated.getCalories());
        if (updated.getProtein() != null) existing.setProtein(updated.getProtein());
        if (updated.getCarbs() != null) existing.setCarbs(updated.getCarbs());
        if (updated.getFats() != null) existing.setFats(updated.getFats());
        if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
        return mealRepository.save(existing);
    }

    public void deleteMeal(UUID id) { mealRepository.deleteById(id); }
}
