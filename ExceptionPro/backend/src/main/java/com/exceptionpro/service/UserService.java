package com.exceptionpro.service;

import com.exceptionpro.dto.*;
import com.exceptionpro.entity.CorporateProfile;
import com.exceptionpro.entity.IndividualProfile;
import com.exceptionpro.entity.User;
import com.exceptionpro.repository.UserRepository;
import com.exceptionpro.security.JwtUtil;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setAccountType(request.getAccountType());
        user.setRole("ROLE_USER");

        if ("Individual".equalsIgnoreCase(request.getAccountType())) {
            IndividualProfile ip = new IndividualProfile();
            ip.setId(UUID.randomUUID());
            ip.setUser(user);
            ip.setFirstName(request.getFirstName());
            ip.setLastName(request.getLastName());
            ip.setDob(request.getDob());
            ip.setGender(request.getGender());
            user.setIndividualProfile(ip);
        } else if (List.of("Buyer", "Supplier", "Buyer and Supplier").contains(request.getAccountType())) {
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
        } else {
            throw new IllegalArgumentException("Invalid Account Type");
        }

        userRepository.save(user);
        emailService.sendWelcomeEmail(user.getEmail());
    }

    public LoginResponse loginUser(LoginRequest request) {
        User user = userRepository.findByEmailFetchProfiles(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email/username or password"));

        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email/username or password");
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
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getAccountType() != null) {
            throw new IllegalArgumentException("Profile is already completed");
        }

        user.setAccountType(accountType);

        if ("Individual".equalsIgnoreCase(accountType)) {
            IndividualProfile ip = new IndividualProfile();
            ip.setId(UUID.randomUUID());
            ip.setUser(user);
            ip.setFirstName(request.getFirstName());
            ip.setLastName(request.getLastName());
            ip.setDob(request.getDob());
            ip.setGender(request.getGender());
            user.setIndividualProfile(ip);
        } else if (List.of("Buyer", "Supplier", "Buyer and Supplier").contains(accountType)) {
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
        } else {
            throw new IllegalArgumentException("Invalid Account Type");
        }

        userRepository.save(user);
    }

    public UserProfileResponse getUserProfile(String email) {
        User user = userRepository.findByEmailFetchProfiles(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return mapToProfileResponse(user);
    }

    public void updateUserProfile(String email, ProfileUpdateRequest request) {
        User user = userRepository.findByEmailFetchProfiles(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if ("Individual".equalsIgnoreCase(user.getAccountType())) {
            IndividualProfile ip = user.getIndividualProfile();
            if (ip != null) {
                ip.setFirstName(request.getFirstName());
                ip.setLastName(request.getLastName());
                ip.setDob(request.getDob());
                ip.setGender(request.getGender());
                ip.setCoverPhoto(request.getCoverPhoto());
                ip.setProfilePicture(request.getProfilePicture());
                ip.setAbout(request.getAbout());
            }
        } else if (user.getCorporateProfile() != null) {
            CorporateProfile cp = user.getCorporateProfile();
            if (cp != null) {
                cp.setOrganizationName(request.getOrganizationName());
                cp.setLegalName(request.getLegalName());
                cp.setStreetAddress(request.getStreetAddress());
                cp.setCity(request.getCity());
                cp.setPincode(request.getPincode());
                cp.setState(request.getState());
                cp.setCountry(request.getCountry());
                cp.setCoverPhoto(request.getCoverPhoto());
                cp.setProfilePicture(request.getProfilePicture());
                cp.setAbout(request.getAbout());
            }
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
        res.setAccountType(user.getAccountType());
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

    private String generateRandomPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
        java.security.SecureRandom random = new java.security.SecureRandom();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 10; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getPassword() == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Incorrect current password");
        }

        if (newPassword.length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters long");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
