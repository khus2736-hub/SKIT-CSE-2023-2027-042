package com.amagen.ems.service;

import com.amagen.ems.dto.request.ChangePasswordRequest;
import com.amagen.ems.dto.request.LoginRequest;
import com.amagen.ems.dto.response.LoginResponse;
import com.amagen.ems.dto.response.UserResponse;
import com.amagen.ems.exception.BadRequestException;
import com.amagen.ems.model.User;
import com.amagen.ems.repository.UserRepository;
import com.amagen.ems.security.CustomUserDetails;
import com.amagen.ems.security.JwtService;
import com.amagen.ems.security.SecurityUtils;
import com.amagen.ems.util.ResponseMapper;
import com.amagen.ems.util.TimeProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final ResponseMapper responseMapper;
    private final TimeProvider timeProvider;

    public LoginResponse login(LoginRequest request) {
        String username = request.username().trim().toLowerCase();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (!user.isEnabled()) {
            throw new DisabledException("Account is disabled");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, request.password())
            );

            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            User authenticatedUser = userDetails.getUser();

            String token = jwtService.generateToken(authenticatedUser);
            UserResponse userResponse = responseMapper.toUserResponse(authenticatedUser);

            return new LoginResponse(token, userResponse);
        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Invalid username or password");
        }
    }

    public UserResponse getMe() {
        User currentUser = SecurityUtils.getCurrentUser();
        // Reload fresh user from DB
        User user = userRepository.findById(currentUser.getId()).orElse(currentUser);
        return responseMapper.toUserResponse(user);
    }

    public void changePassword(ChangePasswordRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password does not match");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        user.setUpdatedAt(timeProvider.now());
        userRepository.save(user);
    }
}
