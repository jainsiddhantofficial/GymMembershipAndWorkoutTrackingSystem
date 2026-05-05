package com.gym.repository;

import com.gym.entity.User;
import com.gym.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    List<User> findByRole(UserRole role);
    List<User> findByIsActiveTrue();
    List<User> findByRoleAndIsActiveTrue(UserRole role);
    boolean existsByEmail(String email);
}
