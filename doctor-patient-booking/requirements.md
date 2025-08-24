# Requirements Document

## Introduction

The Doctor-Patient Consultation Booking Application is a comprehensive healthcare platform that enables doctors to manage their practice and patients to book consultations seamlessly. The system supports fee differentiation for first-time and repeat consultations, revenue tracking, prescription management, and automated notifications. Built with Ionic and Firebase, it provides cross-platform mobile access for both doctors and patients.

## Requirements

### Requirement 1: User Type Selection and Onboarding

**User Story:** As a user, I want to see a clear interface to choose between doctor and patient registration, so that I can access the appropriate features for my role.

#### Acceptance Criteria

1. WHEN app launches THEN the system SHALL display splash screen with app branding
2. WHEN splash screen completes THEN the system SHALL show user type selection (Doctor/Patient icons)
3. WHEN user selects Doctor THEN the system SHALL navigate to doctor registration/login flow
4. WHEN user selects Patient THEN the system SHALL navigate to patient registration/login flow
5. IF user is already logged in THEN the system SHALL navigate directly to appropriate dashboard

### Requirement 2: Doctor Registration with KYC Verification

**User Story:** As a doctor, I want to register with comprehensive verification including KYC documents, so that I can establish credibility and gain patient trust on the platform.

#### Acceptance Criteria

1. WHEN user selects "Register as Doctor" THEN the system SHALL navigate to doctor-specific registration flow
2. WHEN doctor registers THEN the system SHALL offer OTP, password, and Google Sign-In options
3. WHEN doctor chooses OTP registration THEN the system SHALL send OTP to phone number for verification
4. WHEN doctor completes basic registration THEN the system SHALL require KYC verification documents
5. WHEN KYC verification starts THEN the system SHALL require Aadhaar/PAN card upload with OCR validation
6. WHEN medical credentials are needed THEN the system SHALL require Medical License upload (MCI/State Council Registration Number)
7. WHEN hospital affiliation is provided THEN the system SHALL allow optional hospital affiliation proof upload
8. WHEN all documents are uploaded THEN the system SHALL mark doctor profile as "pending admin approval"
9. WHEN doctor tries to access features THEN the system SHALL restrict access until admin approval is complete
10. IF doctor email or phone already exists THEN the system SHALL prevent duplicate registration
11. IF role is already selected THEN the system SHALL prevent role change (role selection lock)

### Requirement 3: Patient Registration and Auto-Activation

**User Story:** As a patient, I want to register quickly with minimal verification and browse available doctors, so that I can find the right specialist for my consultation needs.

#### Acceptance Criteria

1. WHEN user selects "Register as Patient" THEN the system SHALL navigate to patient-specific registration flow
2. WHEN a patient registers THEN the system SHALL require only basic fields (name, mobile/email, DOB, gender, address)
3. WHEN patient enters mobile number THEN the system SHALL send OTP for verification
4. WHEN patient completes OTP verification THEN the system SHALL automatically activate account (no admin approval required)
5. WHEN patient chooses login THEN the system SHALL offer OTP or password-based login options
6. WHEN a patient browses doctors THEN the system SHALL display only verified and approved doctors
7. WHEN a patient views doctor details THEN the system SHALL show both first-time and repeat consultation fees
8. WHEN a patient searches THEN the system SHALL filter by specialization, fees, and ratings
9. IF no doctors match criteria THEN the system SHALL display appropriate message
10. IF role is already selected THEN the system SHALL prevent role change (role selection lock)

### Requirement 4: Super Admin Dashboard and Overview

**User Story:** As a super admin, I want a comprehensive dashboard with key metrics and analytics, so that I can monitor platform performance and make informed decisions.

#### Acceptance Criteria

1. WHEN super admin logs in THEN the system SHALL display dashboard with total doctors, clinics/hospitals, and patients count
2. WHEN dashboard loads THEN the system SHALL show total appointments (daily/weekly/monthly breakdown)
3. WHEN admin views revenue THEN the system SHALL display consultation fees, featured listing revenue, and ads revenue
4. WHEN admin accesses analytics THEN the system SHALL provide real-time platform statistics and growth metrics
5. IF data is unavailable THEN the system SHALL show appropriate loading states and error messages

### Requirement 5: Doctor Management System

**User Story:** As a super admin, I want to manage doctor registrations and profiles, so that I can ensure platform quality and control featured listings.

#### Acceptance Criteria

1. WHEN doctor registers THEN the system SHALL require admin approval before profile activation
2. WHEN admin reviews registration THEN the system SHALL allow approve/reject actions with notification to doctor
3. WHEN admin manages doctors THEN the system SHALL allow profile editing and deactivation
4. WHEN admin handles featured doctors THEN the system SHALL manage highlighted doctor listings and subscriptions
5. IF doctor violates policies THEN the system SHALL allow admin to suspend or deactivate account

### Requirement 6: Patient Management System

**User Story:** As a super admin, I want to manage patient accounts and prevent spam, so that I can maintain platform integrity and user experience.

#### Acceptance Criteria

1. WHEN admin views patients THEN the system SHALL display all registered patients with activity details
2. WHEN patient causes issues THEN the system SHALL allow admin to block/unblock patient accounts
3. WHEN admin blocks patient THEN the system SHALL prevent booking and notify patient of suspension
4. WHEN admin reviews patient activity THEN the system SHALL show booking history and behavior patterns
5. IF patient appeals suspension THEN the system SHALL provide admin tools to review and reverse decisions

### Requirement 7: Appointment Management System

**User Story:** As a super admin, I want to manage all platform appointments, so that I can resolve conflicts and handle special requests from doctors.

#### Acceptance Criteria

1. WHEN admin views appointments THEN the system SHALL show all bookings with filter options (doctor, date, status)
2. WHEN doctor requests changes THEN the system SHALL allow admin to cancel/reschedule appointments
3. WHEN appointment conflicts occur THEN the system SHALL provide admin tools to resolve scheduling issues
4. WHEN admin modifies appointments THEN the system SHALL notify both doctor and patient of changes
5. IF emergency cancellation needed THEN the system SHALL allow admin override with automatic refund processing

### Requirement 8: Payment and Commission Management

**User Story:** As a super admin, I want to track all payments and manage platform commissions, so that I can ensure proper revenue distribution and financial transparency.

#### Acceptance Criteria

1. WHEN admin views payments THEN the system SHALL track consultation fees, featured listing payments, and ads revenue
2. WHEN commission is configured THEN the system SHALL allow setting platform fee percentage per consultation
3. WHEN payment settlement occurs THEN the system SHALL generate reports for doctors/hospitals with commission deductions
4. WHEN admin reviews finances THEN the system SHALL provide detailed payment tracking and settlement history
5. IF payment disputes arise THEN the system SHALL provide admin tools to investigate and resolve issues

### Requirement 9: Advertisement and Content Management

**User Story:** As a super admin, I want to manage advertisements and platform content, so that I can control user experience and maintain platform information.

#### Acceptance Criteria

1. WHEN admin manages ads THEN the system SHALL control AdMob/Facebook Ads placement and visibility
2. WHEN banner ads are configured THEN the system SHALL allow admin to control where ads appear in the app
3. WHEN admin updates content THEN the system SHALL manage static pages (About Us, Terms, Privacy Policy)
4. WHEN FAQ is updated THEN the system SHALL allow admin to add/edit/remove frequently asked questions
5. IF content needs approval THEN the system SHALL provide admin workflow for content review and publishing

### Requirement 10: Notification and Communication Management

**User Story:** As a super admin, I want to manage platform notifications and communications, so that I can keep users informed and engaged.

#### Acceptance Criteria

1. WHEN admin sends notifications THEN the system SHALL allow push notifications to all users or specific groups
2. WHEN WhatsApp notifications are managed THEN the system SHALL provide templates for booking confirmations and reminders
3. WHEN bulk communication is needed THEN the system SHALL allow admin to send targeted messages to user segments
4. WHEN notification templates are updated THEN the system SHALL allow admin to customize message content and timing
5. IF notification delivery fails THEN the system SHALL provide admin with delivery status and retry options

### Requirement 11: Reports, Analytics and User Role Management

**User Story:** As a super admin, I want comprehensive reporting and role management, so that I can analyze platform performance and delegate administrative tasks.

#### Acceptance Criteria

1. WHEN admin generates reports THEN the system SHALL provide daily/weekly/monthly reports for appointments, revenue, and users
2. WHEN data export is needed THEN the system SHALL allow report export in Excel/PDF formats
3. WHEN role management is required THEN the system SHALL support Super Admin (full control) and Sub Admin (limited roles)
4. WHEN sub admin is created THEN the system SHALL allow role assignment (manage doctors only, payments only, etc.)
5. IF admin access is compromised THEN the system SHALL provide audit logs and access control management

### Requirement 12: Consultation Booking System

**User Story:** As a patient, I want to book consultations with doctors, so that I can receive medical care at my preferred time.

#### Acceptance Criteria

1. WHEN a patient selects a doctor THEN the system SHALL display available time slots based on doctor's consultation duration
2. WHEN a patient views time slots THEN the system SHALL show booked slots as unavailable (e.g., 1:00-1:15 booked, next available 1:15-1:30)
3. WHEN a patient chooses consultation type THEN the system SHALL apply correct fee (first-time or repeat)
4. WHEN a patient confirms booking THEN the system SHALL process payment before confirmation
5. WHEN booking is successful THEN the system SHALL send confirmation to both patient and doctor
6. IF payment fails THEN the system SHALL not create the booking and notify the patient

### Requirement 13: Doctor Booking Management

**User Story:** As a doctor, I want to manage patient bookings, so that I can approve consultations and maintain my schedule.

#### Acceptance Criteria

1. WHEN a patient books consultation THEN the system SHALL notify the doctor for approval
2. WHEN a doctor views bookings THEN the system SHALL show patient details and consultation type
3. WHEN a doctor approves booking THEN the system SHALL confirm the appointment with the patient
4. WHEN a doctor rejects booking THEN the system SHALL refund payment and notify the patient
5. IF booking time conflicts THEN the system SHALL prevent double-booking

### Requirement 14: Prescription Management

**User Story:** As a doctor, I want to create and send prescriptions to patients, so that they can receive proper medical treatment instructions.

#### Acceptance Criteria

1. WHEN a doctor creates prescription THEN the system SHALL allow text input or file upload
2. WHEN prescription is ready THEN the system SHALL offer WhatsApp or PDF delivery options
3. WHEN prescription is sent via WhatsApp THEN the system SHALL use WhatsApp API integration
4. WHEN prescription is sent as PDF THEN the system SHALL generate downloadable file
5. IF prescription delivery fails THEN the system SHALL retry and notify the doctor

### Requirement 15: Revenue Tracking and Analytics

**User Story:** As a doctor, I want to track my consultation revenue and patient statistics, so that I can monitor my practice performance.

#### Acceptance Criteria

1. WHEN a consultation is completed THEN the system SHALL record revenue by consultation type
2. WHEN doctor views analytics THEN the system SHALL show monthly revenue breakdown
3. WHEN doctor requests report THEN the system SHALL generate first-time vs repeat patient statistics
4. WHEN doctor exports data THEN the system SHALL provide CSV and PDF format options
5. IF no data exists for period THEN the system SHALL display zero values with appropriate message

### Requirement 16: Notification System

**User Story:** As a user, I want to receive timely notifications about bookings and follow-ups, so that I stay informed about my healthcare appointments.

#### Acceptance Criteria

1. WHEN booking is confirmed THEN the system SHALL send push notifications to both parties
2. WHEN follow-up is due THEN the system SHALL send reminder notifications to patients
3. WHEN doctor sets follow-up date THEN the system SHALL schedule automated reminders
4. WHEN notification is sent THEN the system SHALL support both push and SMS/email options
5. IF notification delivery fails THEN the system SHALL log the failure and retry

### Requirement 17: Time Slot Management

**User Story:** As a doctor, I want to configure my consultation duration and manage time slots, so that patients can book appointments based on my availability and schedule.

#### Acceptance Criteria

1. WHEN a doctor sets consultation duration THEN the system SHALL allow customization from 10 to 60 minutes (default 15 minutes)
2. WHEN time slots are generated THEN the system SHALL create slots based on working hours and consultation duration
3. WHEN a slot is booked THEN the system SHALL mark it as unavailable and show next available slot
4. WHEN doctor views schedule THEN the system SHALL display all booked and available time slots
5. IF doctor changes consultation duration THEN the system SHALL regenerate future time slots accordingly

### Requirement 18: Payment Processing

**User Story:** As a patient, I want to pay for consultations primarily in cash with online options available, so that I have flexible payment methods for my bookings.

#### Acceptance Criteria

1. WHEN patient proceeds to payment THEN the system SHALL default to cash payment with online option available
2. WHEN patient chooses cash payment THEN the system SHALL mark booking as "payment pending" and notify doctor
3. WHEN patient chooses online payment THEN the system SHALL integrate with Razorpay or Stripe as secondary option
4. WHEN doctor receives cash payment THEN the system SHALL allow doctor to mark payment as received
5. WHEN payment is processed THEN the system SHALL handle success and failure scenarios
6. WHEN refund is needed THEN the system SHALL process automatic refunds for online payments only
7. WHEN doctor views bookings THEN the system SHALL display payment status (cash received, online paid, pending)
8. IF online payment fails THEN the system SHALL suggest cash payment as primary alternative

### Requirement 19: Google Play Store Deployment

**User Story:** As a platform owner, I want to deploy the application to Google Play Store, so that users can easily download and install the app on their Android devices.

#### Acceptance Criteria

1. WHEN app is built for production THEN the system SHALL generate signed APK/AAB for Play Store
2. WHEN app is submitted THEN the system SHALL meet Google Play Store policies and guidelines
3. WHEN app is published THEN the system SHALL support automatic updates and version management
4. WHEN users download app THEN the system SHALL provide proper app permissions and privacy policy
5. IF app update is available THEN the system SHALL notify users and handle seamless updates

### Requirement 20: Featured Doctor Listing and Monetization

**User Story:** As a doctor, I want to upgrade my profile to featured status for better visibility, so that I can attract more patients and grow my practice.

#### Acceptance Criteria

1. WHEN a doctor chooses featured listing THEN the system SHALL offer subscription or one-time payment options
2. WHEN doctor payment is confirmed THEN the system SHALL mark profile as "Featured" with special badge
3. WHEN patients search doctors THEN the system SHALL display featured doctors at the top of results
4. WHEN featured subscription expires THEN the system SHALL notify doctor and revert to regular listing
5. IF doctor cancels featured status THEN the system SHALL process refund according to policy

### Requirement 21: Advertisement Integration and Revenue

**User Story:** As a platform owner, I want to integrate advertisements to generate revenue while maintaining user experience, so that the platform can be sustainable.

#### Acceptance Criteria

1. WHEN free user uses app THEN the system SHALL display Google AdMob or Facebook Audience Network ads
2. WHEN featured/paid user uses app THEN the system SHALL hide all advertisements
3. WHEN ads are displayed THEN the system SHALL use banner, interstitial, and rewarded ad formats appropriately
4. WHEN user interacts with ads THEN the system SHALL track engagement and revenue metrics
5. IF ad network is unavailable THEN the system SHALL gracefully handle ad loading failures

### Requirement 22: White-Label SaaS Model

**User Story:** As a hospital or clinic owner, I want to use the platform with my own branding, so that I can offer consultation booking under my institution's identity.

#### Acceptance Criteria

1. WHEN hospital subscribes to white-label service THEN the system SHALL allow custom branding configuration
2. WHEN branding is applied THEN the system SHALL update app logo, colors, and name according to client specifications
3. WHEN white-label client onboards THEN the system SHALL provide isolated data environment for their users
4. WHEN subscription is active THEN the system SHALL maintain separate admin panel for each white-label client
5. IF subscription expires THEN the system SHALL disable white-label features and revert to default branding

### Requirement 23: Doctor Verification Module

**User Story:** As a super admin, I want to review and verify doctor documents and credentials, so that I can ensure only legitimate medical professionals are approved on the platform.

#### Acceptance Criteria

1. WHEN doctor submits KYC documents THEN the system SHALL create verification request in admin panel
2. WHEN admin reviews documents THEN the system SHALL display Aadhaar/PAN, Medical License, and Hospital Affiliation proofs
3. WHEN admin verifies documents THEN the system SHALL allow approve/reject actions with detailed comments
4. WHEN doctor is approved THEN the system SHALL activate doctor profile and send approval notification
5. WHEN doctor is rejected THEN the system SHALL send rejection notification with reason and allow resubmission
6. WHEN admin needs clarification THEN the system SHALL allow requesting additional documents or information
7. IF documents are suspicious THEN the system SHALL flag for manual review and investigation

### Requirement 24: Spam Prevention and Reporting System

**User Story:** As a patient, I want to report suspicious or fake doctors, so that I can help maintain platform integrity and protect other users.

#### Acceptance Criteria

1. WHEN patient views doctor profile THEN the system SHALL provide "Report Doctor" option
2. WHEN patient reports doctor THEN the system SHALL collect report reason (fake credentials, inappropriate behavior, etc.)
3. WHEN report is submitted THEN the system SHALL notify admin and flag doctor profile for review
4. WHEN multiple reports are received THEN the system SHALL automatically escalate to priority review
5. WHEN admin investigates report THEN the system SHALL provide all report details and evidence
6. WHEN fake doctor is confirmed THEN the system SHALL immediately suspend account and notify all affected patients
7. IF report is false THEN the system SHALL maintain reporter accountability to prevent abuse

### Requirement 25: Role Selection Lock and Contact Verification

**User Story:** As a platform owner, I want to prevent role switching and ensure contact verification, so that I can maintain user integrity and prevent spam accounts.

#### Acceptance Criteria

1. WHEN user completes registration THEN the system SHALL permanently lock the selected role (doctor/patient)
2. WHEN user attempts role change THEN the system SHALL prevent modification and display appropriate message
3. WHEN mobile/email is provided THEN the system SHALL require OTP verification for all users
4. WHEN verification fails multiple times THEN the system SHALL temporarily block registration attempts
5. WHEN duplicate contact is detected THEN the system SHALL prevent multiple accounts with same phone/email
6. IF suspicious activity is detected THEN the system SHALL flag account for admin review

### Requirement 26: City-wise and Specialty-wise Featured Doctor Sections

**User Story:** As a patient, I want to browse featured doctors organized by city and medical specialty, so that I can easily find the best doctors in my location and for my specific medical needs.

#### Acceptance Criteria

1. WHEN patient opens app home screen THEN the system SHALL display city-wise featured doctor sections
2. WHEN patient views city sections THEN the system SHALL show featured doctors grouped by major cities (Delhi, Mumbai, Bangalore, etc.)
3. WHEN patient browses specialties THEN the system SHALL display specialty-wise featured sections (Cardiology, Dermatology, Pediatrics, etc.)
4. WHEN patient selects city section THEN the system SHALL show all featured doctors in that specific city
5. WHEN patient selects specialty section THEN the system SHALL show all featured doctors of that specialization across cities
6. WHEN featured doctor appears in sections THEN the system SHALL display special "Featured" badge and priority placement
7. WHEN patient searches within sections THEN the system SHALL allow filtering by fees, ratings, and availability
8. WHEN no featured doctors exist THEN the system SHALL show regular doctors in that city/specialty
9. IF patient location is detected THEN the system SHALL prioritize showing nearby city sections first
10. WHEN sections are updated THEN the system SHALL refresh content based on current featured doctor subscriptions

### Requirement 27: Dual Mode Support (Marketplace + Personal)

**User Story:** As a platform owner, I want to offer both marketplace and personal modes in a single app, so that I can serve different doctor preferences while maintaining a unified codebase and maximizing revenue opportunities.

#### Acceptance Criteria

1. WHEN app launches THEN the system SHALL support both Marketplace Mode and Personal Mode within single application
2. WHEN patient opens app in Marketplace Mode THEN the system SHALL display all registered doctors with filters (specialization, location, rating, fees, availability)
3. WHEN patient uses Marketplace Mode THEN the system SHALL allow selection and booking with any verified doctor
4. WHEN app operates in Personal Mode THEN the system SHALL show only one specific doctor's profile and services
5. WHEN Personal Mode is active THEN the system SHALL display doctor's about section, consultation modes (online/offline), availability, and booking options
6. WHEN Personal Mode is configured THEN the system SHALL hide all other doctors and marketplace features
7. WHEN doctor sets up Personal Mode THEN the system SHALL generate doctor-specific link (e.g., dr-rahul.mydoctorconnect.com)
8. WHEN patient accesses doctor-specific link or QR code THEN the system SHALL open app/web directly to that doctor's profile
9. WHEN single codebase is deployed THEN the system SHALL upload only one main app to Google Play Store (e.g., MyDoctor Connect)
10. WHEN doctor personalizes app THEN the system SHALL use in-app settings and dynamic subdomain/webapp configuration
11. WHEN revenue is generated in Marketplace Mode THEN the system SHALL collect from ads, featured profiles, and booking commissions
12. WHEN revenue is generated in Personal Mode THEN the system SHALL collect subscription/flat fees from doctors
13. WHEN doctor requests white-label option THEN the system SHALL offer separate Play Store build with extra charges
14. IF doctor switches between modes THEN the system SHALL maintain data consistency and user experience

### Requirement 28: Data Security and Privacy

**User Story:** As a healthcare platform user, I want my personal and medical data to be secure, so that my privacy is protected according to healthcare regulations.

#### Acceptance Criteria

1. WHEN user data is stored THEN the system SHALL encrypt sensitive information
2. WHEN prescriptions are transmitted THEN the system SHALL use secure communication channels
3. WHEN user accesses data THEN the system SHALL authenticate and authorize access
4. WHEN data is backed up THEN the system SHALL maintain encryption at rest
5. IF security breach is detected THEN the system SHALL log incidents and notify administrators