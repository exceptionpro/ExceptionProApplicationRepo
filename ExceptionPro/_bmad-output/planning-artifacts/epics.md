---
stepsCompleted:
  - "Step 1: Validate Prerequisites and Extract Requirements"
  - "Step 2: Design Epic List"
  - "Step 3: Generate Epics and Stories"
  - "Step 4: Final Validation"
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-ExceptionPro-2026-07-31/prd.md"
  - "_bmad-output/planning-artifacts/architecture/architecture-ExceptionPro-2026-07-31/ARCHITECTURE-SPINE.md"
---

# ExceptionPro - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for ExceptionPro, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

*   **FR-1: Login Form Inputs and Credentials Validation** — The system must provide input fields for Email Address or Username, and Password, validate credentials, and return clear but secure login feedback.
*   **FR-2: Social Sign-In Integration (Google & Facebook)** — Displays prominent social sign-in buttons initiating secure OAuth2 handshakes.
*   **FR-3: Social Login First-Time Redirect** — Checks user records upon successful OAuth2 sign-in; redirects incomplete profiles to Profile Completion screen.
*   **FR-4: Forgotten Password Request UI** — Displays link to navigate to a recovery page to request reset links via email.
*   **FR-5: Cancel Login** — Clears input fields and redirects user back.
*   **FR-6: Dynamic Form Fields based on Account Type** — Dropdown on signup form switches visible fields dynamically:
    *   *Individual:* First Name, Last Name, DOB, Gender, Email Address, Password, Retype Password.
    *   *Corporate:* Organization Name, Legal Name, Street Address, Email Address, City, Pincode, State, Country.
*   **FR-7: Country Dropdown** — Validates country select dynamically using a drop-down menu of valid names.
*   **FR-8: Email Uniqueness** — Enforces unique email registration across standard and social accounts.
*   **FR-9: Password Confirmation Check** — Ensures matching passwords are submitted on registration.
*   **FR-10: My Profile View & Edit** — Logged-in users can view profiles and toggle an edit state to update editable fields (with email and account type locked).
*   **FR-11: Admin Backend Initializer** — Seeding of admin user is handled strictly backend-only. No admin signup or reset interfaces.
*   **FR-12: React Admin Dashboard User List** — Secure view restricted to ADMIN role showing table of users and profile details.

### NonFunctional Requirements

*   **NFR-1: Stateless Authentication** — Token validation must be handled statelessly using JWT (JSON Web Tokens).
*   **NFR-2: Role-Based Access Control (RBAC)** — Backend endpoints secured using role checks (`hasRole('ADMIN')` and `hasRole('USER')`).
*   **NFR-3: Responsive Styling Architecture** — Styling must use standard Vanilla CSS without Tailwind or third-party CSS frameworks.
*   **NFR-4: Interactive Documentation** — Swagger/Springdoc UI must automatically map and document REST endpoints.

### Additional Requirements

*   **Stack Invariants:** Java 21, Spring Boot 3.3.x, PostgreSQL 16, Flyway 10, React 18, and TypeScript 5.
*   **ID Mapping:** Core entities must use UUIDv4 for ID representation.
*   **Flyway Database Schema:** Database schemas must be initialized and seeded using Flyway migrations (`db/migration/V1__init_schema.sql`, `V2__seed_admin.sql`).
*   **Social OAuth2 Restrictions:** First-time social login JWT tokens carry a restricted authorization scope until profile completion details are saved.
*   **Identity Immutability:** User `email` and `accountType` fields must be protected against post-registration mutations.

### UX Design Requirements

*(No separate UX Design Contract present in workspace)*

### FR Coverage Map

*   **FR-1:** Epic 1 - Standard Credentials Login form and session authentication
*   **FR-2:** Epic 1 - Social login integrations (Google & Facebook)
*   **FR-3:** Epic 1 - OAuth2 first-time profile completion router redirect
*   **FR-4:** Epic 1 - Forgotten Password Request page and recovery link stub
*   **FR-5:** Epic 1 - Login form cancel state navigation
*   **FR-6:** Epic 1 - Dynamic registration form switching based on Account Type
*   **FR-7:** Epic 1 - Dropdown mapping of valid countries for corporate registration
*   **FR-8:** Epic 1 - Email uniqueness validation during registration
*   **FR-9:** Epic 1 - Registration password match verification
*   **FR-10:** Epic 1 - Editable "My Profile" page displaying user credentials and organization/personal details
*   **FR-11:** Epic 2 - Administrative user backend database seed and CLI credential maintenance
*   **FR-12:** Epic 2 - React Admin Dashboard user list page and role-secured REST endpoints

## Epic List

### Epic 1: User Identity & Profile Management
Standard users can publicly register (with dynamic forms for Individuals and Organizations), log in securely (via username/password or Google/Facebook), complete their profile redirect if signing in socially for the first time, and view or edit their profile details in a responsive React UI.
*   **FRs covered:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, FR-8, FR-9, FR-10

### Epic 2: Administrative Oversight & User Directory
Administrative users can log in using backend-seeded credentials (with change-password restricted to backend CLI/migration scripts) and view and search all registered users and their details in a secure React Admin Dashboard.
*   **FRs covered:** FR-11, FR-12

## Epic 1: User Identity & Profile Management

Standard users can publicly register (with dynamic forms for Individuals and Organizations), log in securely (via username/password or Google/Facebook), complete their profile redirect if signing in socially for the first time, and view or edit their profile details in a responsive React UI.

### Story 1.1: Project Bootstrap & Database Initialization

As a system developer,
I want the React (TypeScript/Vanilla CSS) frontend project and the Spring Boot (Java 21) backend structure to be bootstrapped with PostgreSQL connectivity and Flyway migration V1,
So that we have a stable build substrate for all identity and profile features.

**Acceptance Criteria:**

**Given** a clean development environment
**When** I run the Maven backend build and NPM frontend run command
**Then** the Spring Boot application starts on port 8080 and React runs on port 5173 without warnings
**And** Flyway executes the V1__init_schema.sql migration creating the baseline users, individual_profiles, and corporate_profiles tables in the PostgreSQL database
**And** the /swagger-ui/index.html URL renders the API documentation dashboard.

### Story 1.2: Standard Credentials Registration

As a prospective platform user,
I want to register an account using my credentials, dynamically entering personal fields for an Individual or organizational fields for a Corporate Account,
So that I can establish my profile and login credentials on the platform.

**Acceptance Criteria:**

**Given** I am an unauthenticated user on the Registration page
**When** I select "Individual" from the Account Type dropdown
**Then** the form dynamically shows First Name, Last Name, Date of Birth, Gender, Email Address, Password, and Retype Password fields, while hiding corporate fields
**When** I select "Buyer" or "Supplier" from the dropdown
**Then** the form dynamically shows Organization Name, Legal Name, Street Address, City, Pincode, State, and a Country dropdown, along with Password and Retype Password, while hiding individual fields
**When** I enter mismatched passwords or an email that already exists
**Then** submitting the form displays validation messages and rejects registration
**When** all inputs are valid and I submit the form
**Then** my account is persisted in the PostgreSQL database, and I am redirected to the login page.

### Story 1.3: Standard Credentials Login & Session Verification

As a registered platform user,
I want to log in using my registered email and password,
So that I can establish a secure, authenticated JWT session on the application.

**Acceptance Criteria:**

**Given** I am on the Login Page
**When** I input incorrect credentials and click "Sign In"
**Then** I receive a secure error message: "Invalid email/username or password" without revealing which field was incorrect
**When** I input correct credentials and click "Sign In"
**Then** the backend returns a stateless JWT token, which is stored securely on the client, and I am redirected to the homepage
**When** I click "Cancel" on the login form
**Then** all input fields are cleared and I am redirected to the public landing page.

### Story 1.4: Social Sign-In & Profile Completion Redirect

As a user logging in via third-party providers,
I want to sign in using my Google or Facebook account and be redirected to a profile completion page if my account type is not yet set,
So that I don't have to manage another password, yet provide the system with my necessary profile attributes.

**Acceptance Criteria:**

**Given** I am on the Login page and click "Sign In With Google" or "Sign In with Facebook"
**When** the OAuth2 handshake completes successfully and I am a new user
**Then** the backend returns a JWT containing a restricted authorization scope
**And** the React application detects this scope and redirects me to the Profile Completion page, blocking access to all other application routes
**When** I submit the required profile fields (Individual or Corporate)
**Then** my profile type is updated in the database, and standard JWT scopes are issued, granting access to the full platform.

### Story 1.5: Forgotten Password Request

As a user who forgot their password,
I want to request a password recovery link,
So that I can securely regain access to my account.

**Acceptance Criteria:**

**Given** I am on the Login Page
**When** I click "Forgotten Password?"
**Then** I am navigated to a Recovery Request view containing an Email input field
**When** I input my registered email and click submit
**Then** the backend generates a secure reset token, logs the event, and displays a confirmation message: "If the email exists, a password reset link has been sent".

### Story 1.6: My Profile View & Edit

As a logged-in user,
I want to view my profile details on the My Profile screen and edit them if necessary,
So that I can keep my personal or organizational details up-to-date.

**Acceptance Criteria:**

**Given** I am logged in and navigate to the My Profile screen
**Then** the screen renders all my profile details (Individual or Corporate) in a read-only state
**When** I click the "Edit" button
**Then** the profile fields become editable input fields, except for Email and Account Type which remain read-only
**When** I modify fields and click "Cancel"
**Then** the inputs revert to their previous values and the form returns to a read-only state
**When** I modify fields and click "Save"
**Then** the updated values are validated and saved in the backend PostgreSQL database, returning a success notification.

## Epic 2: Administrative Oversight & User Directory

Administrative users can log in using backend-seeded credentials (with change-password restricted to backend CLI/migration scripts) and view and search all registered users and their details in a secure React Admin Dashboard.

### Story 2.1: Admin Backend Seeding & Credential Rules

As a system administrator,
I want my account to be seeded directly via backend migration scripts with no public signup or reset interfaces,
So that admin roles are protected from frontend exploits.

**Acceptance Criteria:**

**Given** a clean database installation
**When** the backend migrations run
**Then** Flyway applies V2__seed_admin.sql to populate default admin credentials and the ADMIN role in the database
**And** attempting to access standard UI password recovery or signup pages using admin credentials results in no options to modify administrative passwords, which must only be changed via backend DB queries/scripts.

### Story 2.2: Admin Dashboard User List

As a logged-in administrator,
I want to view all registered users and their details in a secure Admin Dashboard directory,
So that I can verify platform users.

**Acceptance Criteria:**

**Given** I am logged in as a standard user and attempt to navigate to /admin
**Then** the application blocks access, displaying a 403 Forbidden screen
**Given** I am logged in as an Admin
**When** I navigate to the Admin Dashboard link
**Then** the React frontend calls the /api/admin/users REST API using my JWT token
**And** the backend validates the token, verifies the ADMIN role, and returns a JSON payload listing all users
**And** the React application renders this data in a table showing user emails, account types, organization/names, and signup timestamps, allowing me to click on any row to view complete user details.
