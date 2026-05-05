package com.gym.controller;

import com.gym.entity.*;
import com.gym.enums.MuscleGroup;
import com.gym.service.WorkoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class WorkoutController {

    private final WorkoutService workoutService;

    // Exercises
    @GetMapping("/exercises")
    public List<Exercise> getAllExercises(@RequestParam(required = false) String muscleGroup) {
        if (muscleGroup != null) {
            return workoutService.getExercisesByMuscleGroup(MuscleGroup.valueOf(muscleGroup.toUpperCase()));
        }
        return workoutService.getAllExercises();
    }

    @GetMapping("/exercises/{id}")
    public ResponseEntity<Exercise> getExerciseById(@PathVariable UUID id) {
        return ResponseEntity.ok(workoutService.getExerciseById(id));
    }

    @PostMapping("/exercises")
    public ResponseEntity<Exercise> createExercise(@RequestBody Exercise exercise) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workoutService.createExercise(exercise));
    }

    @PutMapping("/exercises/{id}")
    public ResponseEntity<Exercise> updateExercise(@PathVariable UUID id, @RequestBody Exercise exercise) {
        return ResponseEntity.ok(workoutService.updateExercise(id, exercise));
    }

    @DeleteMapping("/exercises/{id}")
    public ResponseEntity<Void> deleteExercise(@PathVariable UUID id) {
        workoutService.deleteExercise(id);
        return ResponseEntity.noContent().build();
    }

    // Workout Sessions
    @GetMapping("/workout-sessions")
    public List<WorkoutSession> getAllSessions() {
        return workoutService.getAllSessions();
    }

    @GetMapping("/users/{userId}/workout-sessions")
    public List<WorkoutSession> getSessionsByUser(@PathVariable UUID userId) {
        return workoutService.getSessionsByUser(userId);
    }

    @GetMapping("/workout-sessions/{id}")
    public ResponseEntity<WorkoutSession> getSessionById(@PathVariable UUID id) {
        return ResponseEntity.ok(workoutService.getSessionById(id));
    }

    @PostMapping("/users/{userId}/workout-sessions")
    public ResponseEntity<WorkoutSession> createSession(@PathVariable UUID userId,
                                                         @RequestBody WorkoutSession session) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workoutService.createSession(userId, session));
    }

    @PutMapping("/workout-sessions/{id}")
    public ResponseEntity<WorkoutSession> updateSession(@PathVariable UUID id,
                                                         @RequestBody WorkoutSession session) {
        return ResponseEntity.ok(workoutService.updateSession(id, session));
    }

    @DeleteMapping("/workout-sessions/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable UUID id) {
        workoutService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }

    // Workout Logs
    @GetMapping("/workout-sessions/{sessionId}/logs")
    public List<WorkoutLog> getLogsBySession(@PathVariable UUID sessionId) {
        return workoutService.getLogsBySession(sessionId);
    }

    @PostMapping("/workout-sessions/{sessionId}/logs")
    public ResponseEntity<WorkoutLog> addLog(@PathVariable UUID sessionId,
                                              @RequestParam UUID exerciseId,
                                              @RequestBody WorkoutLog log) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workoutService.addLog(sessionId, exerciseId, log));
    }

    @PutMapping("/workout-logs/{id}")
    public ResponseEntity<WorkoutLog> updateLog(@PathVariable UUID id, @RequestBody WorkoutLog log) {
        return ResponseEntity.ok(workoutService.updateLog(id, log));
    }

    @DeleteMapping("/workout-logs/{id}")
    public ResponseEntity<Void> deleteLog(@PathVariable UUID id) {
        workoutService.deleteLog(id);
        return ResponseEntity.noContent().build();
    }

    // Body Metrics
    @GetMapping("/users/{userId}/body-metrics")
    public List<BodyMetric> getBodyMetrics(@PathVariable UUID userId) {
        return workoutService.getBodyMetricsByUser(userId);
    }

    @PostMapping("/users/{userId}/body-metrics")
    public ResponseEntity<BodyMetric> addBodyMetric(@PathVariable UUID userId,
                                                     @RequestBody BodyMetric metric) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workoutService.addBodyMetric(userId, metric));
    }

    @DeleteMapping("/body-metrics/{id}")
    public ResponseEntity<Void> deleteBodyMetric(@PathVariable UUID id) {
        workoutService.deleteBodyMetric(id);
        return ResponseEntity.noContent().build();
    }
}
