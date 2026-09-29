package com.exceptionpro.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("exceptionproexceptionpro@gmail.com");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send email to " + to + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void sendWelcomeEmail(String to) {
        String subject = "Welcome to ExceptionPro!";
        String body = "Hello,\n\n" +
                "Thank you for registering an account on ExceptionPro. Your account has been successfully created.\n\n"
                +
                "Best regards,\n" +
                "The ExceptionPro Team";
        sendEmail(to, subject, body);
    }

    public void sendForgotPasswordEmail(String to, String tempPassword) {
        String subject = "ExceptionPro Password Reset";
        String body = "Hello,\n\n" +
                "We received a request to reset your password. Your temporary password is: " + tempPassword + "\n\n" +
                "Please use this password to sign in and update your password in your profile settings.\n\n" +
                "Best regards,\n" +
                "The ExceptionPro Team";
        sendEmail(to, subject, body);
    }
}
