package com.gym.service;

import com.gym.entity.*;
import com.gym.enums.MuscleGroup;
import com.gym.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class WorkoutService {

    private final ExerciseRepository exerciseRepository;
    private final WorkoutSessionRepository sessionRepository;
    private final WorkoutLogRepository logRepository;
    private final BodyMetricRepository bodyMetricRepository;
    private final UserRepository userRepository;

    // Exercises
    public List<Exercise> getAllExercises() { return exerciseRepository.findAll(); }
    public List<Exercise> getExercisesByMuscleGroup(MuscleGroup group) { return exerciseRepository.findByMuscleGroup(group); }

    public Exercise getExerciseById(UUID id) {
        return exerciseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exercise not found: " + id));
    }

    public Exercise createExercise(Exercise exercise) { return exerciseRepository.save(exercise); }

    public Exercise updateExercise(UUID id, Exercise updated) {
        Exercise ex = getExerciseById(id);
        if (updated.getName() != null) ex.setName(updated.getName());
        if (updated.getDescription() != null) ex.setDescription(updated.getDescription());
        if (updated.getMuscleGroup() != null) ex.setMuscleGroup(updated.getMuscleGroup());
        if (updated.getInstructions() != null) ex.setInstructions(updated.getInstructions());
        if (updated.getVideoUrl() != null) ex.setVideoUrl(updated.getVideoUrl());
        return exerciseRepository.save(ex);
    }

    public void deleteExercise(UUID id) { exerciseRepository.deleteById(id); }

    // Sessions
    public List<WorkoutSession> getAllSessions() { return sessionRepository.findAll(); }

    public List<WorkoutSession> getSessionsByUser(UUID userId) {
        return sessionRepository.findByUserIdOrderByDateDesc(userId);
    }

    public WorkoutSession getSessionById(UUID id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Session not found: " + id));
    }

    public WorkoutSession createSession(UUID userId, WorkoutSession session) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        session.setUser(user);
        return sessionRepository.save(session);
    }

    public WorkoutSession updateSession(UUID id, WorkoutSession updated) {
        WorkoutSession existing = getSessionById(id);
        if (updated.getDate() != null) existing.setDate(updated.getDate());
        if (updated.getDurationMinutes() != null) existing.setDurationMinutes(updated.getDurationMinutes());
        if (updated.getNotes() != null) existing.setNotes(updated.getNotes());
        if (updated.getCaloriesBurned() != null) existing.setCaloriesBurned(updated.getCaloriesBurned());
        return sessionRepository.save(existing);
    }

    public void deleteSession(UUID id) { sessionRepository.deleteById(id); }

    // Logs
    public List<WorkoutLog> getLogsBySession(UUID sessionId) {
        return logRepository.findBySessionId(sessionId);
    }

    public WorkoutLog addLog(UUID sessionId, UUID exerciseId, WorkoutLog log) {
        WorkoutSession session = getSessionById(sessionId);
        Exercise exercise = getExerciseById(exerciseId);
        log.setSession(session);
        log.setExercise(exercise);
        return logRepository.save(log);
    }

    public WorkoutLog updateLog(UUID id, WorkoutLog updated) {
        WorkoutLog existing = logRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Log not found: " + id));
        if (updated.getSets() > 0) existing.setSets(updated.getSets());
        if (updated.getReps() != null) existing.setReps(updated.getReps());
        if (updated.getWeightKg() != null) existing.setWeightKg(updated.getWeightKg());
        if (updated.getNotes() != null) existing.setNotes(updated.getNotes());
        return logRepository.save(existing);
    }

    public void deleteLog(UUID id) { logRepository.deleteById(id); }

    // Body metrics
    public List<BodyMetric> getBodyMetricsByUser(UUID userId) {
        return bodyMetricRepository.findByUserIdOrderByRecordedAtDesc(userId);
    }

    public BodyMetric addBodyMetric(UUID userId, BodyMetric metric) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        metric.setUser(user);
        return bodyMetricRepository.save(metric);
    }

    public void deleteBodyMetric(UUID id) { bodyMetricRepository.deleteById(id); }
}
