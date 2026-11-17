package com.exceptionpro.service;

import com.exceptionpro.dto.PlatformSponsorshipRequest;
import com.exceptionpro.dto.PlatformSponsorshipResponse;
import com.exceptionpro.entity.PlatformSponsorship;
import com.exceptionpro.entity.User;
import com.exceptionpro.repository.PlatformSponsorshipRepository;
import com.exceptionpro.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
@Transactional
public class PlatformSponsorshipService {

    private static final String ADMIN_EMAIL = "admin@exceptionpro.com";

    private final PlatformSponsorshipRepository sponsorshipRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public PlatformSponsorshipService(PlatformSponsorshipRepository sponsorshipRepository,
                                      UserRepository userRepository,
                                      NotificationService notificationService,
                                      EmailService emailService) {
        this.sponsorshipRepository = sponsorshipRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    public PlatformSponsorshipResponse submitSponsorship(PlatformSponsorshipRequest request, String currentUserEmail) {
        User user = null;
        if (currentUserEmail != null && !currentUserEmail.isBlank()) {
            user = userRepository.findByEmailFetchProfiles(currentUserEmail)
                    .orElseGet(() -> userRepository.findByEmail(currentUserEmail).orElse(null));
        }

        String sponsorName = request.getSponsorName() != null ? request.getSponsorName().trim() : "";
        String emailId = request.getEmailId() != null ? request.getEmailId().trim() : "";
        String phoneNumber = request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : "";
        String amountRange = request.getAmountRange() != null ? request.getAmountRange().trim() : "";
        String currency = request.getCurrency() != null ? request.getCurrency().trim() : "";

        if (sponsorName.isEmpty()) {
            throw new IllegalArgumentException("Sponsor Name is required.");
        }
        if (emailId.isEmpty()) {
            throw new IllegalArgumentException("Email ID is required.");
        }
        if (amountRange.isEmpty()) {
            throw new IllegalArgumentException("Please select the amount you'd like to Sponsor.");
        }
        if (currency.isEmpty()) {
            throw new IllegalArgumentException("Currency is required.");
        }

        String accountType = "Guest";
        if (user != null) {
            accountType = (user.getAccountType() != null && !user.getAccountType().isBlank())
                    ? user.getAccountType()
                    : ("ROLE_ADMIN".equalsIgnoreCase(user.getRole()) ? "Admin" : "Member");
        }

        PlatformSponsorship entity = new PlatformSponsorship();
        entity.setId(UUID.randomUUID());
        entity.setUser(user);
        entity.setSponsorName(sponsorName);
        entity.setEmailId(emailId);
        entity.setPhoneNumber(phoneNumber.isEmpty() ? null : phoneNumber);
        entity.setAmountRange(amountRange);
        entity.setCurrency(currency);
        entity.setAccountType(accountType);
        entity.setSubmittedByEmail(user != null ? user.getEmail() : emailId);
        entity.setCreatedAt(LocalDateTime.now());

        PlatformSponsorship saved = sponsorshipRepository.save(entity);

        // Notify Admin users (including admin@exceptionpro.com) in-app
        try {
            List<User> allUsers = userRepository.findAll();
            for (User u : allUsers) {
                if (u != null && ("ROLE_ADMIN".equalsIgnoreCase(u.getRole())
                        || ADMIN_EMAIL.equalsIgnoreCase(u.getEmail()))) {
                    String msg = "Sponsor '" + sponsorName + "' (" + emailId + ") submitted a sponsorship request for "
                            + amountRange + " " + currency + ".";
                    String details = "Phone: " + (phoneNumber.isEmpty() ? "N/A" : phoneNumber)
                            + " | Amount: " + amountRange + " " + currency;
                    notificationService.createNotification(
                            u,
                            user,
                            "SPONSORSHIP",
                            "New Platform Sponsorship Request",
                            msg,
                            details,
                            saved.getId(),
                            "PLATFORM_SPONSORSHIP"
                    );
                }
            }
        } catch (Exception ignored) {
            // Do not fail submission if notification fails
        }

        // Send email notification to admin@exceptionpro.com asynchronously
        final String finalPhone = phoneNumber.isEmpty() ? "N/A" : phoneNumber;
        CompletableFuture.runAsync(() -> {
            try {
                String subject = "New Support Our Platform Sponsorship Request - " + sponsorName;
                String body = "Hello Admin,\n\n"
                        + "A new sponsorship request has been submitted in Support Our Platform:\n\n"
                        + "Sponsor Name: " + sponsorName + "\n"
                        + "Email ID: " + emailId + "\n"
                        + "Phone Number: " + finalPhone + "\n"
                        + "Sponsorship Amount Range: " + amountRange + "\n"
                        + "Currency: " + currency + "\n\n"
                        + "Best regards,\n"
                        + "ExceptionPro Platform";
                emailService.sendEmail(ADMIN_EMAIL, subject, body);
            } catch (Exception ignored) {
            }
        });

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PlatformSponsorshipResponse> getAllSponsorships() {
        List<PlatformSponsorship> list = sponsorshipRepository.findAllByOrderByCreatedAtDesc();
        if (list == null) {
            return Collections.emptyList();
        }
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlatformSponsorshipResponse> getMySponsorships(String currentUserEmail) {
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        List<PlatformSponsorship> list = sponsorshipRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        if (list == null) {
            return Collections.emptyList();
        }
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private PlatformSponsorshipResponse mapToResponse(PlatformSponsorship entity) {
        return new PlatformSponsorshipResponse(
                entity.getId(),
                entity.getUser() != null ? entity.getUser().getId() : null,
                entity.getSponsorName(),
                entity.getEmailId(),
                entity.getPhoneNumber(),
                entity.getAmountRange(),
                entity.getCurrency(),
                entity.getAccountType(),
                entity.getSubmittedByEmail(),
                entity.getCreatedAt()
        );
    }
}
