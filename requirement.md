# Requirements Specification: HTML, CSS, TailwindCSS, JavaScript, PHP, and Supabase Website Application

## 1. Purpose
This document defines the supported requirements for a website application built with **HTML, CSS, TailwindCSS, JavaScript, PHP, and Supabase API**. The application shall allow users and administrators to create and manage a custom platform similar in structure and experience to a Supabase-style system, while being presented through a web application with an equivalent desktop-style dashboard structure.

The website application shall provide:
- A web-based dashboard with a desktop-style layout and navigation structure.
- A custom cloud database managed through the website application.
- Supabase API integration for authentication, database, storage, and related backend services.
- Multi-factor authentication for user login.
- Automatic redirection after login to an onboarding flow and then the File Management screen.
- An 8 GB file storage system for each user or workspace.
- File synchronization to cloud storage.
- An analytics page with graphs showing the volume of data stored inside File Management.
- Onboarding screens for first-time or guided usage.

---

## 2. Product Vision
The product shall function as a web-based control center for a Backend-as-a-Service platform inspired by Supabase.

Through the website application, users shall be able to:
- Sign in securely using MFA.
- Complete onboarding when required.
- Access a desktop-like dashboard experience in the browser.
- Create and manage projects or workspaces.
- Manage database tables and records.
- Manage file storage and synchronization.
- View analytics related to stored file volume.
- Manage API usage, authentication settings, and project resources.

---

## 3. Technology Scope
The application shall use or support the following technologies:

### 3.1 Frontend
- HTML5
- CSS3
- TailwindCSS
- JavaScript

### 3.2 Backend
- PHP for server-side web application logic
- Supabase API integration for authentication, database access, storage, and related backend capabilities

### 3.3 Cloud Services
- Supabase PostgreSQL database or equivalent SQL-backed cloud data layer
- Supabase Storage or equivalent object/file storage integration
- Supabase Auth or equivalent MFA-capable authentication integration

---

## 4. System Overview
The system shall consist of the following major components:

### 4.1 Website Application
The website application shall be the primary interface used by administrators, developers, and standard users.

It shall provide a desktop-style dashboard layout including:
- Sidebar navigation
- Header/topbar
- Project/workspace switching
- File Management area
- Analytics area
- Database area
- API/Auth administration area

### 4.2 Cloud Backend
The backend layer shall support:
- User authentication
- Multi-factor authentication
- Session management
- Database provisioning and management
- File upload and synchronization
- Analytics data collection
- API exposure and configuration

### 4.3 Custom Cloud Database
The application shall use a cloud database accessible from the website application.
The cloud database shall store:
- User data
- Project metadata
- File metadata
- Sync records
- Analytics records
- Application configuration

---

## 5. Primary Objectives
The website application shall allow a user to use the full HTML, CSS, TailwindCSS, JavaScript, PHP, and Supabase stack to create and operate a custom website platform similar to Supabase in structure and capabilities.

The system shall support:
1. MFA-secured login.
2. Onboarding flow after authentication.
3. Redirect to File Management after login and onboarding.
4. A desktop-style website dashboard structure.
5. An 8 GB storage system.
6. File synchronization to cloud.
7. An analytics page with visual graphs showing stored data volume.
8. Management of custom database and API-backed resources within the website application.

---

## 6. Functional Requirements

## 6.1 Authentication and Access Control
### 6.1.1 Login
- The website application shall provide a login interface.
- The system shall support email/username and password authentication.
- The system shall authenticate users through Supabase Auth or an equivalent authentication mechanism.

### 6.1.2 Multi-Factor Authentication
- The system shall require multi-factor authentication for user login.
- Supported MFA methods should include at least one of the following:
  - TOTP authenticator app
  - Email verification code
  - SMS verification code where supported
- Users shall not gain full access until MFA verification is completed successfully.

### 6.1.3 Post-Login Redirect with Onboarding
- After successful login and MFA verification, the system shall determine whether the user requires onboarding.
- If onboarding is required, the user shall first be redirected to an onboarding screen or onboarding flow.
- After onboarding is completed, the user shall be redirected automatically to the **File Management** screen.
- If onboarding has already been completed, the user may be redirected directly to File Management.

### 6.1.4 Session Management
- Authenticated sessions shall be maintained securely.
- Session tokens shall be stored securely using browser-safe practices.
- Sessions shall expire after configurable inactivity or security policy limits.
- The user shall be able to log out and invalidate the session.

### 6.1.5 Authorization
- The platform shall support role-based access control.
- Supported roles may include:
  - Administrator
  - Developer
  - Standard User
  - Viewer
- Access to database, files, analytics, APIs, and settings shall be controlled according to role.

---

## 6.2 Website Application Structure
The website application shall provide a desktop-equivalent dashboard structure within the browser.

### 6.2.1 Required Navigation Modules
The application shall include at minimum the following modules:
- Login
- MFA Verification
- Onboarding
- Dashboard
- File Management
- Database Management
- API Management
- Authentication / Users
- Analytics
- Settings
- Project / Workspace Management

### 6.2.2 Desktop-Style Layout
The application shall visually resemble a desktop-style control panel by including:
- Persistent sidebar
- Top navigation/header
- Responsive content panels
- Module-based workspace sections
- Project/workspace context visibility

### 6.2.3 Default Navigation Rule
- After successful login and any required onboarding, File Management shall be the default landing screen.
- File Management shall be the first primary operational screen visible to the authenticated user.

### 6.2.4 Workspace Support
- The application shall support multiple projects or workspaces.
- Each workspace shall have isolated files, analytics, and database-linked resources.

---

## 6.3 Onboarding Requirements
### 6.3.1 Onboarding Availability
- The website application shall provide an onboarding screen for new users.
- The system should also support re-opening onboarding from Settings or Help.

### 6.3.2 Onboarding Purpose
The onboarding flow shall introduce users to:
- File Management
- Database area
- Analytics area
- Project/workspace navigation
- Storage quota overview
- Synchronization features

### 6.3.3 Onboarding Placement
- The onboarding screen shall appear after successful login and MFA when a user has not yet completed onboarding.
- The onboarding process shall be completed before the first normal visit to File Management.

### 6.3.4 Onboarding for Analytics and File Management
- The onboarding flow shall include guidance related to File Management.
- The onboarding flow shall also include explanation of the Analytics page and how storage-volume graphs are interpreted.

---

## 6.4 Website Platform Equivalent Structure
The website application shall support a Supabase-inspired structure inside the browser.

### 6.4.1 Website Modules
The application shall include pages or modules for:
- Home / overview
- Project dashboard
- Database browser/editor
- API documentation and configuration
- Authentication/user management
- File Management
- Analytics
- Settings
- Onboarding

### 6.4.2 Project Creation
- The system shall allow creation of new projects/workspaces.
- Each project/workspace shall provision or connect the required cloud resources.

### 6.4.3 API Exposure
- The system shall support database-backed API functionality through Supabase API or equivalent integrated APIs.
- The platform should support CRUD operations for database tables and records where permitted.

---

## 6.5 Custom Cloud Database Requirements
### 6.5.1 Database Provisioning
- The website application shall allow creation or management of a custom cloud database environment for each project or workspace.
- The application shall support storing and managing structured records through the connected SQL cloud database.

### 6.5.2 Database Management
The application shall allow authorized users to:
- Create tables
- Modify table definitions
- View records
- Insert records
- Update records
- Delete records
- Execute approved queries
- View schema details

### 6.5.3 Database Isolation
- Project or workspace data shall be logically isolated.
- One user or workspace shall not access another workspace’s data unless explicitly authorized.

### 6.5.4 Supabase API Integration
- The website application shall integrate with Supabase API for database operations where applicable.
- Database schema changes should be reflected in the application’s managed resources and UI.

---

## 6.6 File Management Requirements
### 6.6.1 File Management Landing Screen
- File Management shall be the default authenticated destination after onboarding.
- File Management shall show current storage usage and remaining capacity.

### 6.6.2 File Operations
The system shall allow users to:
- Upload files
- Delete files
- Rename files
- Organize files into folders
- Create folders
- Search files
- Filter and sort files by name, type, date, and size

### 6.6.3 Storage Quota
- The website application shall provide an **8 GB file storage system**.
- Each user or workspace shall have a maximum cloud storage allocation of 8 GB unless modified by administrative policy.
- The application shall display total usage, used storage, and remaining storage.

### 6.6.4 Supported Files
The system shall support storage of:
- Documents
- Images
- Archives
- Exports
- Configuration files
- Project assets
- General uploaded resources

### 6.6.5 File Metadata
The system shall store metadata such as:
- File name
- Size
- MIME type
- Created date
- Updated date
- Owner
- Workspace or project association
- Sync status

### 6.6.6 Onboarding in File Management
- File Management shall support onboarding hints, walkthroughs, or first-use guidance.
- New users shall be shown contextual help for upload, sync, quota, and folder organization.

---

## 6.7 File Synchronization Requirements
### 6.7.1 Cloud Synchronization
- Users shall be able to synchronize files or data into the cloud through the website application.
- Synchronization shall support creation, update, and deletion events where supported.

### 6.7.2 Sync Status Visibility
The File Management screen shall display sync states such as:
- Synced
- Syncing
- Pending
- Failed
- Conflict detected

### 6.7.3 Conflict Handling
- The system shall detect synchronization conflicts where relevant.
- The user shall be able to resolve conflicts through a guided interface.

### 6.7.4 Progress Feedback
- The application shall show sync progress and status updates.
- Sync events should update storage usage and analytics records.

---

## 6.8 Analytics Requirements
### 6.8.1 Analytics Page
- The website application shall provide an Analytics page.
- The Analytics page shall include onboarding support or guided explanation for first-time users.

### 6.8.2 Graph Requirements
The Analytics page shall display visual analytics for the volume of data stored inside File Management.
The page shall include at minimum:
- Total stored data volume graph
- Storage usage over time graph
- File count over time graph
- File type distribution graph

### 6.8.3 Storage Volume Visualization
- The graph shall show how much data has been stored in the file management system.
- The graph shall show used versus remaining storage where appropriate.
- The graph shall update after uploads, deletions, and synchronization activity.

### 6.8.4 Filters
The Analytics page should support filtering by:
- Day
- Week
- Month
- Custom date range

### 6.8.5 Onboarding in Analytics
- The Analytics page shall include onboarding guidance that explains charts, data ranges, and storage metrics.
- New users shall be shown a first-use explanation of stored volume and quota usage.

### 6.8.6 Export
- Users should be able to export analytics summaries or chart views where supported.

---

## 6.9 Dashboard Requirements
### 6.9.1 Dashboard Overview
The dashboard should summarize:
- Current project or workspace
- Storage usage
- Recent file activity
- Sync activity
- Database status
- API/Auth status
- Security notices

### 6.9.2 Notifications
The application should provide notifications for:
- Successful login
- MFA verification results
- Onboarding completion
- File upload results
- Sync success or failure
- Storage threshold warnings
- Analytics updates

---

## 6.10 API and Integration Requirements
### 6.10.1 API Management
- The application shall provide a section for viewing and managing relevant API-backed resources.
- Users shall be able to see endpoint usage context, keys, or tokens where permitted.

### 6.10.2 API Security
- Access tokens and API keys shall be protected.
- Sensitive credentials shall not be exposed in plaintext by default.

### 6.10.3 PHP Integration Layer
- PHP shall handle server-side page routing, session coordination, integration logic, and secure communication with Supabase APIs or supporting backend services.

### 6.10.4 JavaScript Frontend Behavior
- JavaScript shall handle interactive actions such as onboarding flow, dashboard interactions, file upload status, sync indicators, and analytics UI behavior.

### 6.10.5 TailwindCSS Styling
- TailwindCSS shall be used to support consistent dashboard styling, responsive layout behavior, and desktop-style interface components.

---

## 6.11 User Management Requirements
- Administrators shall be able to manage users and roles.
- The system should support invitation, deactivation, and permission assignment.
- MFA status should be visible where allowed by policy.

---

## 7. Non-Functional Requirements

## 7.1 Security
- Passwords shall be handled securely.
- MFA shall be enforced for authenticated access.
- All sensitive data shall be transmitted securely.
- Session handling shall follow secure web practices.
- File access shall be controlled by authorization rules.
- Workspace isolation shall be enforced.

## 7.2 Performance
- The website application shall load dashboard screens within acceptable time under normal conditions.
- File lists and analytics graphs shall remain responsive for supported data sizes.

## 7.3 Reliability
- Sync failures shall be logged and surfaced to the user.
- Authentication and onboarding state shall be handled consistently.
- Database and storage errors shall be reported clearly.

## 7.4 Scalability
- The architecture should support growth in users, workspaces, files, storage metrics, and API usage.

## 7.5 Usability
- The onboarding flow shall be understandable and concise.
- File Management shall be easy to access and use as the main landing page.
- Analytics graphs shall be clearly labeled and readable.

## 7.6 Maintainability
- The codebase shall be modular across frontend, PHP integration, and Supabase service integration.
- File management, onboarding, analytics, auth, and database modules should remain logically separated.

---

## 8. Suggested Website Structure
A recommended website page/module structure is:

- `/login`
- `/mfa`
- `/onboarding`
- `/dashboard`
- `/dashboard/files`
- `/dashboard/database`
- `/dashboard/apis`
- `/dashboard/users`
- `/dashboard/analytics`
- `/dashboard/settings`
- `/dashboard/projects`

The default authenticated path should be:
1. `/onboarding` when required
2. `/dashboard/files` after onboarding or if onboarding is already complete

---

## 9. Suggested Data Entities
The application should support entities such as:
- User
- Session
- MFA Challenge
- Onboarding Status
- Project
- Workspace
- File Record
- File Sync Event
- Storage Usage Record
- Analytics Snapshot
- Database Resource
- API Key / Token Metadata
- Audit Log

---

## 10. Suggested Analytics Metrics
The analytics page should track at minimum:
- Total bytes stored
- Percentage of 8 GB used
- Remaining storage
- Number of files stored
- Storage growth over time
- Number of synchronization events
- Failed sync count
- File type distribution

---

## 11. Example User Flows
### 11.1 Authentication Flow
1. User opens the website application.
2. User enters email/username and password.
3. System requests MFA code.
4. User enters MFA code.
5. System validates MFA.
6. If onboarding is incomplete, user is redirected to onboarding.
7. After onboarding, user is redirected automatically to File Management.

### 11.2 File Management Flow
1. User lands on File Management.
2. User views current storage usage.
3. User uploads or manages files.
4. File sync status is shown.
5. Storage metrics update.

### 11.3 Analytics Flow
1. User opens Analytics.
2. User sees onboarding help if first visit.
3. System loads storage volume data.
4. Graphs show stored data volume and usage over time.
5. User filters by date range.

---

## 12. Acceptance Criteria
The implementation shall be considered aligned with this specification when:
- MFA is required during login.
- A successful login leads to onboarding when required.
- After onboarding, the user is redirected to File Management.
- The application provides an 8 GB storage system.
- Users can synchronize files into cloud storage.
- File Management includes onboarding or guided usage support.
- The Analytics page includes onboarding support and graphs showing stored file volume.
- The website uses HTML, CSS, TailwindCSS, JavaScript, PHP, and Supabase API integration to provide a Supabase-inspired control structure.
- The application supports a custom cloud database managed from within the website interface.

---

## 13. Recommended Implementation Notes
Suggested stack alignment:
- HTML for structure
- CSS and TailwindCSS for styling
- JavaScript for frontend interaction and onboarding behavior
- PHP for application routing, middleware, and integration logic
- Supabase Auth for login and MFA support
- Supabase PostgreSQL for structured data
- Supabase Storage for file storage and quota-backed file handling
- Charting library for analytics visualizations

---

## 14. Future Enhancements
Optional future features may include:
- Team collaboration and shared folders
- Realtime analytics updates
- Advanced quota plans beyond 8 GB
- Storage billing support
- Database backup/restore tools
- Embedded API testing console
- Expanded onboarding tours

---

## 15. Summary
This requirements document defines a website application built with HTML, CSS, TailwindCSS, JavaScript, PHP, and Supabase API integration. The application must support MFA-secured login, onboarding screens, automatic redirection to File Management, 8 GB cloud file storage, file synchronization, analytics with visual graphs for stored file volume, and a desktop-style dashboard structure inspired by Supabase, all within a custom cloud-backed website environment.

