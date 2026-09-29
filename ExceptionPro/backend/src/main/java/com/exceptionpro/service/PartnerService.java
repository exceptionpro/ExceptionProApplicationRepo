package com.exceptionpro.service;

import com.exceptionpro.dto.PartnerSearchResponse;
import com.exceptionpro.dto.PartnerRecommendationsResponse;
import com.exceptionpro.dto.UserProfileResponse;
import com.exceptionpro.entity.BusinessPartnerRequest;
import com.exceptionpro.entity.User;
import com.exceptionpro.repository.BusinessPartnerRequestRepository;
import com.exceptionpro.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class PartnerService {

    private final UserRepository userRepository;
    private final BusinessPartnerRequestRepository requestRepository;
    private final UserService userService;

    public PartnerService(UserRepository userRepository,
            BusinessPartnerRequestRepository requestRepository,
            UserService userService) {
        this.userRepository = userRepository;
        this.requestRepository = requestRepository;
        this.userService = userService;
    }

    public List<PartnerSearchResponse> searchUsers(String currentUserEmail, String query) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<User> targetUsers = userRepository.searchUsers(currentUserEmail, query);
        List<PartnerSearchResponse> results = new ArrayList<>();

        for (User targetUser : targetUsers) {
            Optional<BusinessPartnerRequest> requestOpt = requestRepository.findBetweenUsers(currentUser.getId(),
                    targetUser.getId());
            String status = "NONE";
            UUID requestId = null;

            if (requestOpt.isPresent()) {
                BusinessPartnerRequest request = requestOpt.get();
                requestId = request.getId();
                String reqStatus = request.getStatus();

                if ("PENDING".equals(reqStatus)) {
                    if (request.getSender().getId().equals(currentUser.getId())) {
                        status = "PENDING_SENT";
                    } else {
                        status = "PENDING_RECEIVED";
                    }
                } else if ("ACCEPTED".equals(reqStatus)) {
                    status = "ACCEPTED";
                } else if ("DECLINED".equals(reqStatus)) {
                    if (request.getSender().getId().equals(currentUser.getId())) {
                        status = "DECLINED_SENT";
                    } else {
                        status = "DECLINED_RECEIVED";
                    }
                }
            }

            UserProfileResponse profileDto = userService.mapToProfileResponse(targetUser);
            results.add(new PartnerSearchResponse(profileDto, status, requestId));
        }

        return results;
    }

    public void sendPartnerRequest(String senderEmail, UUID receiverId) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new IllegalArgumentException("Sender not found"));

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new IllegalArgumentException("Receiver not found"));

        if (sender.getId().equals(receiver.getId())) {
            throw new IllegalArgumentException("You cannot send a partnership request to yourself");
        }

        Optional<BusinessPartnerRequest> existingOpt = requestRepository.findBetweenUsers(sender.getId(), receiverId);
        if (existingOpt.isPresent()) {
            BusinessPartnerRequest existing = existingOpt.get();
            if ("PENDING".equals(existing.getStatus()) || "ACCEPTED".equals(existing.getStatus())) {
                throw new IllegalArgumentException(
                        "A partnership request is already pending or established with this user");
            } else {
                // If it was declined, we reset it to pending
                existing.setStatus("PENDING");
                existing.setSender(sender);
                existing.setReceiver(receiver);
                existing.setUpdatedAt(LocalDateTime.now());
                requestRepository.save(existing);
                return;
            }
        }

        BusinessPartnerRequest newRequest = new BusinessPartnerRequest();
        newRequest.setId(UUID.randomUUID());
        newRequest.setSender(sender);
        newRequest.setReceiver(receiver);
        newRequest.setStatus("PENDING");
        newRequest.setCreatedAt(LocalDateTime.now());
        newRequest.setUpdatedAt(LocalDateTime.now());

        requestRepository.save(newRequest);
    }

    public void acceptPartnerRequest(String receiverEmail, UUID requestId) {
        User receiver = userRepository.findByEmail(receiverEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        BusinessPartnerRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Partnership request not found"));

        if (!request.getReceiver().getId().equals(receiver.getId())) {
            throw new IllegalArgumentException("You can only accept requests sent to you");
        }

        if (!"PENDING".equals(request.getStatus())) {
            throw new IllegalArgumentException("Only pending requests can be accepted");
        }

        request.setStatus("ACCEPTED");
        request.setUpdatedAt(LocalDateTime.now());
        requestRepository.save(request);
    }

    public void declinePartnerRequest(String receiverEmail, UUID requestId) {
        User receiver = userRepository.findByEmail(receiverEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        BusinessPartnerRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Partnership request not found"));

        if (!request.getReceiver().getId().equals(receiver.getId())) {
            throw new IllegalArgumentException("You can only decline requests sent to you");
        }

        if (!"PENDING".equals(request.getStatus())) {
            throw new IllegalArgumentException("Only pending requests can be declined");
        }

        request.setStatus("DECLINED");
        request.setUpdatedAt(LocalDateTime.now());
        requestRepository.save(request);
    }

    public void cancelOrRemovePartnerRequest(String email, UUID requestId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        BusinessPartnerRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Partnership request not found"));

        if (!request.getSender().getId().equals(user.getId()) && !request.getReceiver().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You are not authorized to cancel or remove this request");
        }

        requestRepository.delete(request);
    }

    public List<PartnerSearchResponse> getIncomingPendingRequests(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return requestRepository.findIncomingPendingRequests(user.getId()).stream()
                .map(r -> new PartnerSearchResponse(
                        userService.mapToProfileResponse(r.getSender()),
                        "PENDING_RECEIVED",
                        r.getId()))
                .collect(Collectors.toList());
    }

    public List<PartnerSearchResponse> getOutgoingPendingRequests(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return requestRepository.findOutgoingPendingRequests(user.getId()).stream()
                .map(r -> new PartnerSearchResponse(
                        userService.mapToProfileResponse(r.getReceiver()),
                        "PENDING_SENT",
                        r.getId()))
                .collect(Collectors.toList());
    }

    public List<PartnerSearchResponse> getAcceptedPartnerships(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return requestRepository.findAcceptedPartnerships(user.getId()).stream()
                .map(r -> {
                    User target = r.getSender().getId().equals(user.getId()) ? r.getReceiver() : r.getSender();
                    return new PartnerSearchResponse(
                            userService.mapToProfileResponse(target),
                            "ACCEPTED",
                            r.getId());
                })
                .collect(Collectors.toList());
    }

    public PartnerSearchResponse getUserProfileAndStatus(String currentUserEmail, String targetEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalArgumentException("Current user not found"));
        User targetUser = userRepository.findByEmail(targetEmail)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found"));

        Optional<BusinessPartnerRequest> requestOpt = requestRepository.findBetweenUsers(currentUser.getId(), targetUser.getId());
        String status = "NONE";
        UUID requestId = null;

        if (requestOpt.isPresent()) {
            BusinessPartnerRequest request = requestOpt.get();
            requestId = request.getId();
            String reqStatus = request.getStatus();

            if ("PENDING".equals(reqStatus)) {
                if (request.getSender().getId().equals(currentUser.getId())) {
                    status = "PENDING_SENT";
                } else {
                    status = "PENDING_RECEIVED";
                }
            } else if ("ACCEPTED".equals(reqStatus)) {
                status = "ACCEPTED";
            } else if ("DECLINED".equals(reqStatus)) {
                if (request.getSender().getId().equals(currentUser.getId())) {
                    status = "DECLINED_SENT";
                } else {
                    status = "DECLINED_RECEIVED";
                }
            }
        }

        UserProfileResponse profileDto = userService.mapToProfileResponse(targetUser);
        return new PartnerSearchResponse(profileDto, status, requestId);
    }

    public PartnerRecommendationsResponse getRecommendations(String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        com.exceptionpro.entity.CorporateProfile currentCp = currentUser.getCorporateProfile();
        String currentCity = (currentCp != null && currentCp.getCity() != null) ? currentCp.getCity().trim() : "";
        String currentState = (currentCp != null && currentCp.getState() != null) ? currentCp.getState().trim() : "";
        String currentCountry = (currentCp != null && currentCp.getCountry() != null) ? currentCp.getCountry().trim() : "";

        List<User> candidates = userRepository.searchUsers(currentUserEmail, "");

        List<User> matches = new ArrayList<>();
        String title = "Suggested Connections";

        if (!currentCity.isEmpty()) {
            for (User c : candidates) {
                com.exceptionpro.entity.CorporateProfile cp = c.getCorporateProfile();
                if (cp != null && cp.getCity() != null && cp.getCity().trim().equalsIgnoreCase(currentCity)) {
                    if (!matches.contains(c)) {
                        matches.add(c);
                    }
                }
            }
            if (!matches.isEmpty()) {
                title = "Suggested Connections in " + currentCity;
            }
        }

        if (!currentState.isEmpty()) {
            boolean addedStateMatches = false;
            for (User c : candidates) {
                com.exceptionpro.entity.CorporateProfile cp = c.getCorporateProfile();
                if (cp != null && cp.getState() != null && cp.getState().trim().equalsIgnoreCase(currentState)) {
                    if (!matches.contains(c)) {
                        matches.add(c);
                        addedStateMatches = true;
                    }
                }
            }
            if (matches.isEmpty() && addedStateMatches) {
                title = "Suggested Connections in " + currentState;
            }
        }

        if (!currentCountry.isEmpty()) {
            boolean addedCountryMatches = false;
            for (User c : candidates) {
                com.exceptionpro.entity.CorporateProfile cp = c.getCorporateProfile();
                if (cp != null && cp.getCountry() != null && cp.getCountry().trim().equalsIgnoreCase(currentCountry)) {
                    if (!matches.contains(c)) {
                        matches.add(c);
                        addedCountryMatches = true;
                    }
                }
            }
            if (matches.isEmpty() && addedCountryMatches) {
                title = "Suggested Connections in " + currentCountry;
            }
        }

        // Fallback: Add remaining candidates if matches is empty or low
        for (User c : candidates) {
            if (!matches.contains(c)) {
                matches.add(c);
            }
        }

        List<PartnerSearchResponse> results = new ArrayList<>();
        for (User targetUser : matches) {
            Optional<BusinessPartnerRequest> requestOpt = requestRepository.findBetweenUsers(currentUser.getId(),
                    targetUser.getId());
            String status = "NONE";
            UUID requestId = null;

            if (requestOpt.isPresent()) {
                BusinessPartnerRequest request = requestOpt.get();
                requestId = request.getId();
                String reqStatus = request.getStatus();

                if ("PENDING".equals(reqStatus)) {
                    if (request.getSender().getId().equals(currentUser.getId())) {
                        status = "PENDING_SENT";
                    } else {
                        status = "PENDING_RECEIVED";
                    }
                } else if ("ACCEPTED".equals(reqStatus)) {
                    status = "ACCEPTED";
                } else if ("DECLINED".equals(reqStatus)) {
                    if (request.getSender().getId().equals(currentUser.getId())) {
                        status = "DECLINED_SENT";
                    } else {
                        status = "DECLINED_RECEIVED";
                    }
                }
            }

            UserProfileResponse profileDto = userService.mapToProfileResponse(targetUser);
            results.add(new PartnerSearchResponse(profileDto, status, requestId));
        }

        return new PartnerRecommendationsResponse(title, results);
    }
}
