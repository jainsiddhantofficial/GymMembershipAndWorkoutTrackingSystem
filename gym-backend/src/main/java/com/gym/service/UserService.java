package com.gym.service;

import com.gym.entity.User;
import com.gym.enums.UserRole;
import com.gym.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getUsersByRole(UserRole role) {
        return userRepository.findByRole(role);
    }

    public List<User> getActiveMembers() {
        return userRepository.findByRoleAndIsActiveTrue(UserRole.MEMBER);
    }

    public List<User> getActiveTrainers() {
        return userRepository.findByRoleAndIsActiveTrue(UserRole.TRAINER);
    }

    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    public User createUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already in use: " + user.getEmail());
        }
        return userRepository.save(user);
    }

    public User updateUser(UUID id, User updated) {
        User existing = getUserById(id);
        if (updated.getFirstName() != null) existing.setFirstName(updated.getFirstName());
        if (updated.getLastName() != null) existing.setLastName(updated.getLastName());
        if (updated.getPhone() != null) existing.setPhone(updated.getPhone());
        if (updated.getGender() != null) existing.setGender(updated.getGender());
        if (updated.getDateOfBirth() != null) existing.setDateOfBirth(updated.getDateOfBirth());
        if (updated.getAddress() != null) existing.setAddress(updated.getAddress());
        if (updated.getProfileImage() != null) existing.setProfileImage(updated.getProfileImage());
        if (updated.getEmergencyContactName() != null) existing.setEmergencyContactName(updated.getEmergencyContactName());
        if (updated.getEmergencyContactPhone() != null) existing.setEmergencyContactPhone(updated.getEmergencyContactPhone());
        if (updated.getRole() != null) existing.setRole(updated.getRole());
        return userRepository.save(existing);
    }

    public User toggleUserActive(UUID id) {
        User user = getUserById(id);
        user.setActive(!user.isActive());
        return userRepository.save(user);
    }

    public void deleteUser(UUID id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found: " + id);
        }
        userRepository.deleteById(id);
    }

    public long countActiveMembers() {
        return userRepository.findByRoleAndIsActiveTrue(UserRole.MEMBER).size();
    }
}
