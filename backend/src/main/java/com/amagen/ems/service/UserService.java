package com.amagen.ems.service;

import com.amagen.ems.dto.request.ChangeRoleRequest;
import com.amagen.ems.dto.request.ResetPasswordRequest;
import com.amagen.ems.dto.response.PageResponse;
import com.amagen.ems.dto.response.UserResponse;
import com.amagen.ems.exception.BadRequestException;
import com.amagen.ems.exception.ResourceNotFoundException;
import com.amagen.ems.model.User;
import com.amagen.ems.model.enums.Role;
import com.amagen.ems.repository.UserRepository;
import com.amagen.ems.security.SecurityUtils;
import com.amagen.ems.util.ResponseMapper;
import com.amagen.ems.util.TimeProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ResponseMapper responseMapper;
    private final TimeProvider timeProvider;

    public PageResponse<UserResponse> getUsers(Role role, String search, Pageable pageable) {
        Page<User> page;
        boolean hasSearch = search != null && !search.isBlank();

        if (role != null && hasSearch) {
            page = userRepository.findByRoleAndUsernameContainingIgnoreCase(role, search.trim(), pageable);
        } else if (role != null) {
            page = userRepository.findByRole(role, pageable);
        } else if (hasSearch) {
            page = userRepository.findByUsernameContainingIgnoreCase(search.trim(), pageable);
        } else {
            page = userRepository.findAll(pageable);
        }

        List<UserResponse> content = responseMapper.toUserResponses(page.getContent());
        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    public UserResponse changeRole(String id, ChangeRoleRequest request) {
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        String currentUserId = SecurityUtils.getCurrentUserId();
        if (targetUser.getId().equals(currentUserId)) {
            throw new BadRequestException("An admin cannot change their own role");
        }

        Role newRole = request.role();

        // At least one enabled ADMIN must always remain
        if (targetUser.getRole() == Role.ADMIN && newRole != Role.ADMIN) {
            long activeAdminCount = userRepository.countByRoleAndEnabled(Role.ADMIN, true);
            if (activeAdminCount <= 1 && targetUser.isEnabled()) {
                throw new BadRequestException("At least one enabled administrator must remain");
            }
        }

        // An unlinked account cannot be given the EMPLOYEE role
        if (newRole == Role.EMPLOYEE && (targetUser.getEmployeeId() == null || targetUser.getEmployeeId().isBlank())) {
            throw new BadRequestException("An unlinked account cannot be given the EMPLOYEE role");
        }

        targetUser.setRole(newRole);
        targetUser.setUpdatedAt(timeProvider.now());
        User updated = userRepository.save(targetUser);

        return responseMapper.toUserResponse(updated);
    }

    public void resetPassword(String id, ResetPasswordRequest request) {
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        targetUser.setPassword(passwordEncoder.encode(request.newPassword()));
        targetUser.setUpdatedAt(timeProvider.now());
        userRepository.save(targetUser);
    }
}
