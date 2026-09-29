package com.exceptionpro.repository;

import com.exceptionpro.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.individualProfile LEFT JOIN FETCH u.corporateProfile WHERE u.email = :email")
    Optional<User> findByEmailFetchProfiles(@Param("email") String email);

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u " +
            "LEFT JOIN FETCH u.individualProfile ip " +
            "LEFT JOIN FETCH u.corporateProfile cp " +
            "WHERE u.email <> :currentEmail " +
            "AND u.role <> 'ROLE_ADMIN' " +
            "AND (:search IS NULL OR :search = '' " +
            "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(ip.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(ip.lastName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(cp.organizationName) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<User> searchUsers(@Param("currentEmail") String currentEmail, @Param("search") String search);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.individualProfile LEFT JOIN FETCH u.corporateProfile WHERE u.accountType = 'Supplier' OR u.accountType = 'Buyer and Supplier'")
    List<User> findSuppliers();
}
