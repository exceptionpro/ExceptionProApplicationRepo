package com.exceptionpro.service;

import com.exceptionpro.dto.ConversationSummaryDto;
import com.exceptionpro.dto.DirectMessageDto;
import com.exceptionpro.dto.SendMessageRequest;
import com.exceptionpro.entity.CorporateProfile;
import com.exceptionpro.entity.DirectMessage;
import com.exceptionpro.entity.IndividualProfile;
import com.exceptionpro.entity.User;
import com.exceptionpro.repository.DirectMessageRepository;
import com.exceptionpro.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class MessagingService {

    private final DirectMessageRepository messageRepository;
    private final UserRepository userRepository;

    public MessagingService(DirectMessageRepository messageRepository, UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    public DirectMessageDto sendMessage(String senderEmail, SendMessageRequest request) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new IllegalArgumentException("Sender user not found"));

        User receiver = null;
        if (request.getReceiverId() != null) {
            receiver = userRepository.findById(request.getReceiverId())
                    .orElse(null);
        }
        if (receiver == null && request.getReceiverEmail() != null && !request.getReceiverEmail().isBlank()) {
            receiver = userRepository.findByEmail(request.getReceiverEmail())
                    .orElse(null);
        }
        if (receiver == null) {
            throw new IllegalArgumentException("Recipient user not found");
        }

        if (request.getMessageText() == null || request.getMessageText().trim().isEmpty()) {
            throw new IllegalArgumentException("Message text cannot be empty");
        }

        DirectMessage msg = new DirectMessage();
        msg.setId(UUID.randomUUID());
        msg.setSender(sender);
        msg.setReceiver(receiver);
        msg.setMessageText(request.getMessageText().trim());
        msg.setCreatedAt(LocalDateTime.now());
        msg.setRead(false);

        DirectMessage saved = messageRepository.save(msg);
        return mapToDto(saved);
    }

    public List<DirectMessageDto> getConversationWithUser(String currentUserEmail, String partnerEmailOrId) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalArgumentException("Current user not found"));

        User partner = null;
        try {
            UUID partnerUuid = UUID.fromString(partnerEmailOrId);
            partner = userRepository.findById(partnerUuid).orElse(null);
        } catch (IllegalArgumentException e) {
            // Not a UUID, try email
        }

        if (partner == null) {
            partner = userRepository.findByEmail(partnerEmailOrId)
                    .orElseThrow(() -> new IllegalArgumentException("Partner user not found"));
        }

        // Messages within 90 days
        LocalDateTime cutoff = LocalDateTime.now().minusDays(90);
        List<DirectMessage> messages = messageRepository.findConversationBetweenUsers(
                currentUser.getId(), partner.getId(), cutoff);

        // Mark incoming messages as read
        for (DirectMessage m : messages) {
            if (m.getReceiver().getId().equals(currentUser.getId()) && !m.isRead()) {
                m.setRead(true);
            }
        }

        return messages.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<ConversationSummaryDto> getConversationsList(String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        LocalDateTime cutoff = LocalDateTime.now().minusDays(90);
        List<DirectMessage> messages = messageRepository.findRecentMessagesForUser(currentUser.getId(), cutoff);

        // Map to keep track of partner -> last message
        Map<UUID, ConversationSummaryDto> conversationMap = new LinkedHashMap<>();

        for (DirectMessage msg : messages) {
            User partner = msg.getSender().getId().equals(currentUser.getId()) ? msg.getReceiver() : msg.getSender();
            UUID partnerId = partner.getId();

            if (!conversationMap.containsKey(partnerId)) {
                ConversationSummaryDto summary = new ConversationSummaryDto();
                summary.setPartnerId(partnerId);
                summary.setPartnerEmail(partner.getEmail());
                summary.setPartnerName(getUserDisplayName(partner));
                summary.setPartnerAvatar(getUserAvatar(partner));
                summary.setPartnerAccountType(partner.getAccountType());
                summary.setLastMessage(msg.getMessageText());
                summary.setLastMessageTime(msg.getCreatedAt());
                summary.setUnreadCount(0);
                conversationMap.put(partnerId, summary);
            }

            if (msg.getReceiver().getId().equals(currentUser.getId()) && !msg.isRead()) {
                ConversationSummaryDto summary = conversationMap.get(partnerId);
                summary.setUnreadCount(summary.getUnreadCount() + 1);
            }
        }

        return new ArrayList<>(conversationMap.values());
    }

    private DirectMessageDto mapToDto(DirectMessage msg) {
        DirectMessageDto dto = new DirectMessageDto();
        dto.setId(msg.getId());
        dto.setSenderId(msg.getSender().getId());
        dto.setSenderEmail(msg.getSender().getEmail());
        dto.setSenderName(getUserDisplayName(msg.getSender()));
        dto.setSenderAvatar(getUserAvatar(msg.getSender()));

        dto.setReceiverId(msg.getReceiver().getId());
        dto.setReceiverEmail(msg.getReceiver().getEmail());
        dto.setReceiverName(getUserDisplayName(msg.getReceiver()));
        dto.setReceiverAvatar(getUserAvatar(msg.getReceiver()));

        dto.setMessageText(msg.getMessageText());
        dto.setCreatedAt(msg.getCreatedAt());
        dto.setRead(msg.isRead());
        return dto;
    }

    private String getUserDisplayName(User user) {
        if (user == null) return "";
        if ("Individual".equalsIgnoreCase(user.getAccountType())) {
            IndividualProfile ip = user.getIndividualProfile();
            if (ip != null) {
                String name = ((ip.getFirstName() != null ? ip.getFirstName() : "") + " " +
                        (ip.getLastName() != null ? ip.getLastName() : "")).trim();
                if (!name.isEmpty()) return name;
            }
        } else {
            CorporateProfile cp = user.getCorporateProfile();
            if (cp != null && cp.getOrganizationName() != null && !cp.getOrganizationName().isBlank()) {
                return cp.getOrganizationName();
            }
        }
        return user.getEmail();
    }

    private String getUserAvatar(User user) {
        if (user == null) return "";
        if ("Individual".equalsIgnoreCase(user.getAccountType())) {
            IndividualProfile ip = user.getIndividualProfile();
            if (ip != null) return ip.getProfilePicture();
        } else {
            CorporateProfile cp = user.getCorporateProfile();
            if (cp != null) return cp.getProfilePicture();
        }
        return "";
    }
}
