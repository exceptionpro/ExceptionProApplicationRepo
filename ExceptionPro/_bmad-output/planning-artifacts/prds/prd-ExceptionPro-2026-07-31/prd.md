---
title: ExceptionPro User Authentication & Profile Management
status: final
created: 2026-07-31
updated: 2026-07-31
---

# PRD: ExceptionPro User Authentication & Profile Management

## 0. Document Purpose
This Product Requirements Document (PRD) defines the functional and non-functional requirements for the core identity, registration, profile management, and administration features of the ExceptionPro platform. It serves as the single source of truth for the Product Manager, Frontend Developers (React TypeScript), Backend Developers (Java Spring Boot), and QA engineers. The system vocabulary is anchored in the Glossary (§3), and all functional requirements (§4) are mapped to User Journeys (§2.3) and carry testable consequences.

## 1. Vision
ExceptionPro aims to streamline user access and profile management in the Procure to Pay domain. It provides a secure, intuitive entry point for different user groups—namely Individuals, Buyers, Suppliers, and hybrid Buyer/Suppliers—along with dedicated administrative oversight. By balancing self-service registration, social sign-in flexibility, and robust backend admin controls, the application establishes a secure and scalable foundation for all subsequent procure-to-pay transactional workflows.

## 2. Target User

### 2.1 Jobs To Be Done
* **As a Procure-to-Pay Participant (Individual or Organization Representative)**, I want to easily register and securely log in, so that I can access my personalized profile and participate in procurement activities.
* **As a Social Login User**, I want to sign in with my existing Google or Facebook credentials, so that I don't have to manage another set of passwords.
* **As a Platform Administrator**, I want a secure dashboard to view registered users and their details, so that I can monitor platform adoption and verify participant profiles.

### 2.2 Non-Users (v1)
* **Guest Users:** Users who do not register or authenticate are explicitly blocked from accessing any system capabilities beyond the login and registration surfaces.
* **Self-Registering Administrators:** There is no mechanism for public signup of administrative accounts to prevent unauthorized backend access.

### 2.3 Key User Journeys

* **UJ-1. Individual registers and views their profile.**
  * **Persona + context:** Alex, a freelance consultant, wants to register as an Individual to access platform resources.
  * **Entry state:** Unauthenticated, on the Login Page.
  * **Path:** Alex clicks "Create New Account", selects "Individual" from the Account Type dropdown, fills in First Name, Last Name, Date of Birth, Gender, E-Mail Address, Password, and Retype Password, then clicks register. Upon successful registration, Alex is returned to the login screen, enters the credentials, and is logged in. Alex then navigates to the "My Profile" menu.
  * **Climax:** Alex sees a complete, formatted view of their profile showing all entered details, validating that registration succeeded.
  * **Resolution:** Alex logs out or leaves the session active.

* **UJ-2. Supplier signs in via Google for the first time and completes profile.**
  * **Persona + context:** Sarah, representing a logistics firm, wants to sign in quickly using her company Google account.
  * **Entry state:** Unauthenticated, on the Login Page.
  * **Path:** Sarah clicks "Sign In With Google". Since this is her first login, the application detects that her profile is incomplete and redirects her to the Profile Completion Page. She selects "Supplier" as her Account Type, which displays the organization fields. She enters Organization Name, Legal Name, Street Address, City, Pincode, State, and selects "India" from the Country dropdown. She submits the form.
  * **Climax:** Sarah is redirected to the "My Profile" screen, displaying both her Google account details and her newly entered organization profile information.
  * **Resolution:** Sarah is now fully registered and can proceed to supplier workflows.
  * **Edge case:** If Sarah cancels or closes the browser during profile completion, her next login attempt using Google will force her back to the Profile Completion Page until it is finished.

* **UJ-3. System Admin views registered user profiles.**
  * **Persona + context:** David, a system auditor, needs to review active suppliers and buyers registered on the platform.
  * **Entry state:** Admin credentials seeded in the database. David logs in using these backend-created credentials.
  * **Path:** David logs in, bypasses standard user landing pages, and navigates to the Admin Dashboard link. He is presented with a search/filter list of all registered users on the system. He clicks on Sarah's supplier profile.
  * **Climax:** David sees a read-only list containing Sarah's organization name, address, account type, and registration timestamp.
  * **Resolution:** David logs out securely.

## 3. Glossary
* **Individual Account** — A type of user account for sole practitioners. Registration requires personal fields (First/Last Name, DOB, Gender, Email, Password).
* **Corporate Account** — A generic term covering the "Buyer", "Supplier", and "Buyer and Supplier" account types. Registration requires organizational fields (Organization Name, Legal Name, Street Address, City, Pincode, State, Country).
* **Profile Completion** — A mandatory step for users who authenticate via Social Logins for the first time, ensuring they choose an Account Type and provide required details before accessing the application.
* **Admin Dashboard** — A secure React frontend interface restricted to administrators for searching and viewing all registered users and their profile details.
* **Backend Credentials** — Administrative credentials that can only be generated, altered, or reset via backend commands or database scripts, without any public UI exposed.

## 4. Features

### 4.1 Login & Authentication
**Description:** Provides the gateway to the application. Supports standard credentials, social logins (Google, Facebook), forgot password flow, and redirects first-time social sign-in users to profile completion. Realizes UJ-1, UJ-2, UJ-3.

**Functional Requirements:**

#### FR-1: Login Form Inputs and Credentials Validation
The system must provide input fields for Email Address or Username, and Password.
* **Consequences:**
  * Submitting correct credentials grants access and redirects to the landing page.
  * Submitting incorrect credentials displays an error message: "Invalid email/username or password" and does not reveal which field was incorrect.
  * Validates email format on the frontend before submission.

#### FR-2: Social Sign-In Integration (Google & Facebook)
The system must display prominent options for "Sign In With Google" and "Sign In With Facebook".
* **Consequences:**
  * Tapping Google/Facebook initiates the OAuth2 flow.
  * If the OAuth2 handshake fails, the user is returned to the Login page with a generic authentication error toast.

#### FR-3: Social Login First-Time Redirect
The system must check if a social login user has a complete profile upon successful OAuth2 handshake.
* **Consequences:**
  * If the user record exists but has no `Account Type` associated, the system redirects the user to the Profile Completion Screen.
  * Bypassing or navigating away from this screen forces a redirect back on subsequent page requests.

#### FR-4: Forgotten Password Request UI
The Login page must display a "Forgotten Password?" link.
* **Consequences:**
  * Clicking "Forgotten Password?" navigates to a recovery page where the user can input their registered email.
  * [ASSUMPTION: The system will send a password reset link to the email provided, but the actual email delivery system and reset token validation logic is in scope for the backend API.]

#### FR-5: Cancel Login
The Login Form must include a "Cancel" button.
* **Consequences:**
  * Clicking "Cancel" clears the inputs and redirects the user to a public landing page or resets the form state.

---

### 4.2 User Registration
**Description:** Enables public signups. The form dynamically shifts fields based on the selected Account Type (Individual vs. Corporate variants). Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-6: Dynamic Form Fields based on Account Type
The Registration Page must feature an Account Type dropdown with options: "Individual", "Buyer", "Supplier", "Buyer and Supplier".
* **Consequences:**
  * Selecting "Individual" displays fields: First Name, Last Name, Date of Birth, Gender, E-Mail Address, Password, Retype Password. All other fields are hidden.
  * Selecting "Buyer", "Supplier", or "Buyer and Supplier" displays fields: Organization Name, Legal Name, Street Address, Email Address, City, Pincode, State, Country. Personal fields (First/Last name, DOB, gender) are hidden.
  * [ASSUMPTION: Corporate registrations still require a password and password confirmation during registration, so fields for Password and Retype Password are also rendered under corporate types.]

#### FR-7: Country Dropdown
The Country field for corporate registration must be a dropdown listing all valid country names.
* **Consequences:**
  * User must select a country from the list. Free-text entry is disabled.

#### FR-8: Email Uniqueness
The registration email address must be unique across the entire system.
* **Consequences:**
  * Submitting an email that is already registered returns a validation error: "An account with this email address already exists."

#### FR-9: Password Confirmation Check
The frontend and backend must validate that "Password" and "Retype Password" match exactly.
* **Consequences:**
  * If they do not match, the form displays a validation message: "Passwords do not match" and prevents submission.

---

### 4.3 Profile Management
**Description:** Logged-in users can view, edit, and update their profile information. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-10: My Profile View & Edit
The system must provide a "My Profile" screen displaying all stored fields of the logged-in user and allow editing.
* **Consequences:**
  * If logged in as an Individual, shows First Name, Last Name, DOB, Gender, and Email Address.
  * If logged in as a Corporate Account, shows Account Type, Organization Name, Legal Name, Street Address, Email Address, City, Pincode, State, and Country.
  * The user can click an "Edit" button to toggle the fields into an editable state (input fields/dropdowns).
  * Clicking "Save" validates input fields and persists the updated profile details in the backend database.
  * [ASSUMPTION: The user's primary Email Address and Account Type are immutable once registered to preserve login identity consistency.]
  * Clicking "Cancel" reverts all fields back to their last-persisted values.

---

### 4.4 Admin Dashboard & Control
**Description:** Restricted admin functionality initialized strictly on the backend, with user list viewing on the React frontend. Realizes UJ-3.

**Functional Requirements:**

#### FR-11: Admin Backend Initializer
The system must seed administrative credentials directly in the backend database.
* **Consequences:**
  * There are no UI screens for creating an admin or requesting an admin password reset.
  * Admin password changes are executed exclusively via backend CLI scripts or direct database updates.

#### FR-12: React Admin Dashboard User List
The React application must include an Admin Dashboard view, restricted to users logged in with Admin credentials.
* **Consequences:**
  * Displays a table of all registered users including Name/Organization, Account Type, Email, and Creation date.
  * Clicking on a user displays their complete profile details in a modal or side panel.
  * Attempting to access the Admin Dashboard page as a regular user returns a 403 Forbidden page.
  * The Java Spring Boot backend secures all admin endpoints using role-based authorization (e.g., Spring Security `@PreAuthorize("hasRole('ADMIN')")`).

## 5. Non-Goals (Explicit)
* **Self-Service Admin Registration:** No registration screens will exist for Admin roles.
* **Frontend Password Change for Admin:** No password modification or reset UI will be created for Admin accounts.
* **Multi-Factor Authentication (MFA):** MFA is not required for v1.

## 6. MVP Scope

### 6.1 In Scope
* Standard Login and social login (Google/Facebook) with first-time profile completion.
* Dynamic signup forms for Individual, Buyer, Supplier, and Buyer & Supplier accounts.
* Editable "My Profile" view for logged-in users, allowing updates to profile fields (with immutable email/account type).
* Seeded Admin account capability (backend-only password updates).
* React Admin Dashboard to search and view registered user profiles.
* Java Spring Boot Swagger UI for API documentation and endpoint testing.

### 6.2 Out of Scope for MVP
* Automated password recovery email dispatcher (only endpoint scaffolding is in scope).
* Admin ability to delete or modify user accounts from the frontend.

## 7. Success Metrics
* **Primary**
  * **SM-1**: 100% of newly registered users (both individual and corporate) can successfully log in using their credentials. Validates FR-1, FR-6.
  * **SM-2**: 100% of social login signups complete the mandatory profile registration before getting application access. Validates FR-3.
* **Secondary**
  * **SM-3**: Admin can view registered user profiles without API leaks to unauthorized standard users. Validates FR-12.
* **Counter-metrics**
  * **SM-C1**: Registration drop-off rates due to too many mandatory fields. We monitor this but do not optimize by removing core business profile requirements.

## 8. Open Questions
1. **Password Policy Details:** What are the exact character requirements (length, special characters) for standard passwords?
2. **Social Sign-In Accounts:** If a user signs up using Google and then Facebook using the same email address, should the system link their accounts or keep them separate?

## 9. Assumptions Index
* **[ASSUMPTION-01]** (from §4.1 / FR-4): The system handles password recovery request workflows by generating a token and saving it, but integration with a live SMTP email server is deferred.
* **[ASSUMPTION-02]** (from §4.2 / FR-6): Corporate registrants (Buyer, Supplier, Buyer/Supplier) require a password during the registration form so they can log in via username/password in addition to potential social login.
* **[ASSUMPTION-03]** (from §4.4 / FR-12): The backend will expose secured REST endpoints documented in Swagger that require Bearer tokens, and frontend routing in React will use role-based checks.
* **[ASSUMPTION-04]** (from §4.3 / FR-10): The user's primary Email Address and Account Type are immutable once registered to preserve login identity consistency.
