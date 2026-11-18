package com.exceptionpro.service;

import java.security.SecureRandom;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.exceptionpro.dto.LoginRequest;
import com.exceptionpro.dto.LoginResponse;
import com.exceptionpro.dto.ProfileUpdateRequest;
import com.exceptionpro.dto.UserProfileResponse;
import com.exceptionpro.dto.UserRegistrationRequest;
import com.exceptionpro.entity.CorporateProfile;
import com.exceptionpro.entity.IndividualProfile;
import com.exceptionpro.entity.User;
import com.exceptionpro.repository.UserRepository;
import com.exceptionpro.security.JwtUtil;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil, EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    public void registerUser(UserRegistrationRequest request) {
        if (!request.getPassword().equals(request.getRetypePassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("An account with this email address already exists");
        }

        if (!List.of("Buyer", "Supplier").contains(request.getAccountType())) {
            throw new IllegalArgumentException("Account Type must be either Buyer or Supplier");
        }

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setAccountType(request.getAccountType());
        user.setRole("ROLE_USER");

        CorporateProfile cp = new CorporateProfile();
        cp.setId(UUID.randomUUID());
        cp.setUser(user);
        cp.setOrganizationName(request.getOrganizationName());
        cp.setLegalName(request.getLegalName());
        cp.setStreetAddress(request.getStreetAddress());
        cp.setCity(request.getCity());
        cp.setPincode(request.getPincode());
        cp.setState(request.getState());
        cp.setCountry(request.getCountry());
        user.setCorporateProfile(cp);

        userRepository.save(user);
        emailService.sendWelcomeEmail(user.getEmail());
    }

    public LoginResponse loginUser(LoginRequest request) {
        User user = userRepository.findByEmailFetchProfiles(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email/username or password"));

        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email/username or password");
        }

        // Ensure admin@exceptionpro.com / ROLE_ADMIN always has accountType 'Admin'
        if ("ROLE_ADMIN".equalsIgnoreCase(user.getRole()) || "admin@exceptionpro.com".equalsIgnoreCase(user.getEmail())) {
            if (!"Admin".equalsIgnoreCase(user.getAccountType())) {
                user.setAccountType("Admin");
                userRepository.save(user);
            }
        } else if ("Individual".equalsIgnoreCase(user.getAccountType())) {
            user.setAccountType("Buyer");
            userRepository.save(user);
        }

        org.springframework.security.core.userdetails.User userDetails =
                new org.springframework.security.core.userdetails.User(
                        user.getEmail(),
                        user.getPassword(),
                        Collections.singletonList(new SimpleGrantedAuthority(user.getRole()))
                );

        String token = jwtUtil.generateToken(userDetails);
        boolean complete = user.getAccountType() != null;

        return new LoginResponse(token, user.getEmail(), user.getRole(), user.getAccountType(), complete);
    }

    public LoginResponse handleSocialLogin(String email) {
        User user = userRepository.findByEmailFetchProfiles(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setId(UUID.randomUUID());
            newUser.setEmail(email);
            newUser.setPassword(null); // No standard password
            newUser.setAccountType(null); // Force first-time profile completion
            newUser.setRole("ROLE_USER");
            return userRepository.save(newUser);
        });

        if ("Individual".equalsIgnoreCase(user.getAccountType())) {
            user.setAccountType(null);
            userRepository.save(user);
        }

        org.springframework.security.core.userdetails.User userDetails =
                new org.springframework.security.core.userdetails.User(
                        user.getEmail(),
                        "",
                        Collections.singletonList(new SimpleGrantedAuthority(user.getRole()))
                );

        String token = jwtUtil.generateToken(userDetails);
        boolean complete = user.getAccountType() != null;

        return new LoginResponse(token, user.getEmail(), user.getRole(), user.getAccountType(), complete);
    }

    public void completeSocialProfile(String email, ProfileUpdateRequest request, String accountType) {
        User user = userRepository.findByEmailFetchProfiles(email)
                .orElseGet(() -> userRepository.findByEmail(email)
                        .orElseThrow(() -> new IllegalArgumentException("User not found")));

        if (!List.of("Buyer", "Supplier").contains(accountType)) {
            throw new IllegalArgumentException("Account Type must be either Buyer or Supplier");
        }

        user.setAccountType(accountType);

        // Save First Name, Last Name, Date of Birth, Gender from Google Sign-In first-time profile page
        if (request.getFirstName() != null && !request.getFirstName().isBlank()) {
            IndividualProfile ip = user.getIndividualProfile();
            if (ip == null) {
                ip = new IndividualProfile();
                ip.setId(UUID.randomUUID());
                ip.setUser(user);
            }
            ip.setFirstName(request.getFirstName().trim());
            ip.setLastName(request.getLastName() != null ? request.getLastName().trim() : "");
            ip.setDob(request.getDob());
            ip.setGender(request.getGender() != null && !request.getGender().isBlank() ? request.getGender().trim() : "Male");
            user.setIndividualProfile(ip);
        } else if (request.getOrganizationName() != null && !request.getOrganizationName().isBlank()) {
            CorporateProfile cp = user.getCorporateProfile();
            if (cp == null) {
                cp = new CorporateProfile();
                cp.setId(UUID.randomUUID());
                cp.setUser(user);
            }
            cp.setOrganizationName(request.getOrganizationName());
            cp.setLegalName(request.getLegalName());
            cp.setStreetAddress(request.getStreetAddress());
            cp.setCity(request.getCity());
            cp.setPincode(request.getPincode());
            cp.setState(request.getState());
            cp.setCountry(request.getCountry());
            user.setCorporateProfile(cp);
        } else {
            throw new IllegalArgumentException("Please enter First Name, Last Name, Date of Birth, and Gender");
        }

        userRepository.save(user);
    }

    public UserProfileResponse getUserProfile(String email) {
        User user = userRepository.findByEmailFetchProfiles(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if ("ROLE_ADMIN".equalsIgnoreCase(user.getRole()) || "admin@exceptionpro.com".equalsIgnoreCase(user.getEmail())) {
            if (!"Admin".equalsIgnoreCase(user.getAccountType())) {
                user.setAccountType("Admin");
                userRepository.save(user);
            }
        } else if ("Individual".equalsIgnoreCase(user.getAccountType())) {
            user.setAccountType("Buyer");
            userRepository.save(user);
        }

        return mapToProfileResponse(user);
    }

    public void updateUserProfile(String email, ProfileUpdateRequest request) {
        User user = userRepository.findByEmailFetchProfiles(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getIndividualProfile() != null && (user.getCorporateProfile() == null || request.getFirstName() != null)) {
            IndividualProfile ip = user.getIndividualProfile();
            if (request.getFirstName() != null) ip.setFirstName(request.getFirstName());
            if (request.getLastName() != null) ip.setLastName(request.getLastName());
            if (request.getDob() != null) ip.setDob(request.getDob());
            if (request.getGender() != null) ip.setGender(request.getGender());
            ip.setCoverPhoto(request.getCoverPhoto());
            ip.setProfilePicture(request.getProfilePicture());
            ip.setAbout(request.getAbout());
        } else if (user.getCorporateProfile() != null) {
            CorporateProfile cp = user.getCorporateProfile();
            if (request.getOrganizationName() != null) cp.setOrganizationName(request.getOrganizationName());
            if (request.getLegalName() != null) cp.setLegalName(request.getLegalName());
            if (request.getStreetAddress() != null) cp.setStreetAddress(request.getStreetAddress());
            if (request.getCity() != null) cp.setCity(request.getCity());
            if (request.getPincode() != null) cp.setPincode(request.getPincode());
            if (request.getState() != null) cp.setState(request.getState());
            if (request.getCountry() != null) cp.setCountry(request.getCountry());
            cp.setCoverPhoto(request.getCoverPhoto());
            cp.setProfilePicture(request.getProfilePicture());
            cp.setAbout(request.getAbout());
        }
        userRepository.save(user);
    }

    public List<UserProfileResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToProfileResponse)
                .collect(Collectors.toList());
    }

    public UserProfileResponse mapToProfileResponse(User user) {
        UserProfileResponse res = new UserProfileResponse();
        res.setId(user.getId());
        res.setEmail(user.getEmail());

        String normalizedAccountType = user.getAccountType();
        if ("ROLE_ADMIN".equalsIgnoreCase(user.getRole()) || "admin@exceptionpro.com".equalsIgnoreCase(user.getEmail())) {
            normalizedAccountType = "Admin";
        } else if ("Individual".equalsIgnoreCase(normalizedAccountType)) {
            normalizedAccountType = "Buyer";
        }
        res.setAccountType(normalizedAccountType);
        res.setRole(user.getRole());

        if (user.getIndividualProfile() != null) {
            IndividualProfile ip = user.getIndividualProfile();
            res.setFirstName(ip.getFirstName());
            res.setLastName(ip.getLastName());
            res.setDob(ip.getDob());
            res.setGender(ip.getGender());
            res.setCoverPhoto(ip.getCoverPhoto());
            res.setProfilePicture(ip.getProfilePicture());
            res.setAbout(ip.getAbout());
        }

        if (user.getCorporateProfile() != null) {
            CorporateProfile cp = user.getCorporateProfile();
            res.setOrganizationName(cp.getOrganizationName());
            res.setLegalName(cp.getLegalName());
            res.setStreetAddress(cp.getStreetAddress());
            res.setCity(cp.getCity());
            res.setPincode(cp.getPincode());
            res.setState(cp.getState());
            res.setCountry(cp.getCountry());
            res.setCoverPhoto(cp.getCoverPhoto());
            res.setProfilePicture(cp.getProfilePicture());
            res.setAbout(cp.getAbout());
        }

        return res;
    }

    public void handleForgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No account registered with this email address."));

        String temporaryPassword = generateRandomPassword();
        user.setPassword(passwordEncoder.encode(temporaryPassword));
        userRepository.save(user);

        emailService.sendForgotPasswordEmail(user.getEmail(), temporaryPassword);
    }

    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getPassword() == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        if (newPassword.length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters long");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private String generateRandomPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
