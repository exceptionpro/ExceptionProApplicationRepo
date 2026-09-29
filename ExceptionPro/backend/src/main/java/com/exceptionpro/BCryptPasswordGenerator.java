package com.exceptionpro;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class BCryptPasswordGenerator {
    public static void main(String args[]) {
        String password = "admin123";

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String bcryptPassword = encoder.encode(password);

        System.out.println("Original Password : " + password);
        System.out.println("BCrypt Password   : " + bcryptPassword);
    }
}
