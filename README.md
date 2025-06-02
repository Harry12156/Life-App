# Life Remainder App Fire Base Step By Step

![Life Remainder App Logo](/imeges/Life%20Logo.png)

# Firebase Authentication & Firestore Security

A secure backend implementation for Firebase Authentication (email/password) with granular Firestore security rules.

## Features

- 🔐 Email/Password authentication
- 🛡️ Role-based access control (admin/users)
- 📝 Data validation for all collections
- 🔍 Fine-grained read/write permissions
- 📊 Admin dashboard access

## Prerequisites

- Firebase project ([console.firebase.google.com](https://console.firebase.google.com/))
- Firebase Authentication Enable and acces Email/Password
- After Enable Cloud Firestore

## Setup Instructions Cloud Firestore

### 2. Cloud Firestore Rules Setup

- Replace Fire base Configuration
```bash
        const firebaseConfig = {
            apiKey: "AIzaSyCEd9VlKaoSQo6ICHNncEiOcKkB0rmW9as",
            authDomain: "life-99481.firebaseapp.com",
            projectId: "life-99481",
            storageBucket: "life-99481.appspot.com",
            messagingSenderId: "474511342704",
            appId: "1:474511342704:web:a6eacccdff394a903988b5",
            measurementId: "G-883YJPY2VJ"
        };
```

#### 2. Cloud Firestore Rules Setup

```bash
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ===== Admin Function =====
    function isAdmin() {
      return request.auth != null && 
        request.auth.token.email in [
          "tecnogamage@gmail.com",
          "kaveenmadhushank19@gmail.com"
        ];
    }

    // ===== Reminders Collection (Your Main Feature) =====
    match /reminders/{reminderId} {
      // Allow read, update, and delete only if the user ID matches or user is admin
      allow read, update, delete: if (request.auth != null && resource.data.userId == request.auth.uid) || isAdmin();
      
      // Allow create only if the user is authenticated and sets their own user ID
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid &&
                       validateReminderData();
    }

    // ===== Categories Collection =====
    match /categories/{categoryId} {
      // Allow read for all authenticated users
      allow read: if request.auth != null;
      
      // Allow write only for your own categories or if admin
      allow write: if request.auth != null && 
                    ((resource == null || resource.data.userId == request.auth.uid) && 
                    request.resource.data.userId == request.auth.uid) || isAdmin();
    }

    // ===== Tasks Collection =====
    match /tasks/{taskId} {
      allow read: if (request.auth != null && request.auth.uid == resource.data.userId) || isAdmin();
      allow create: if request.auth != null &&
                       request.auth.uid == request.resource.data.userId &&
                       validateTaskData();
      allow update: if request.auth != null &&
                       request.auth.uid == resource.data.userId &&
                       request.auth.uid == request.resource.data.userId &&
                       validateTaskData();
      allow delete: if (request.auth != null && request.auth.uid == resource.data.userId) || isAdmin();
    }

    // ===== Events Collection =====
    match /events/{eventId} {
      allow read: if (request.auth != null && request.auth.uid == resource.data.userId) || isAdmin();
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
                       request.auth.uid == request.resource.data.userId &&
                       validateEventData(request.resource.data);
    }

    // ===== Notes Collection =====
    match /notes/{noteId} {
      allow read: if (request.auth != null && request.auth.uid == resource.data.userId) || isAdmin();
      allow create: if request.auth != null &&
                       request.auth.uid == request.resource.data.userId &&
                       validateNoteData(request.resource.data);
      allow update: if request.auth != null &&
                       request.auth.uid == resource.data.userId &&
                       request.auth.uid == request.resource.data.userId &&
                       validateNoteData(request.resource.data);
      allow delete: if (request.auth != null && request.auth.uid == resource.data.userId) || isAdmin();
    }

    // ===== Users Collection =====
    match /users/{userId} {
      // Users can only read and write their own profiles, admins can access all
      allow read: if (request.auth != null && userId == request.auth.uid) || isAdmin();
      allow write: if request.auth != null && userId == request.auth.uid;
      allow create: if request.auth != null &&
                       request.auth.uid == userId &&
                       validateUserData(request.resource.data);
      allow update: if request.auth != null &&
                       request.auth.uid == userId &&
                       validateUserData(request.resource.data);
    }

    // ===== Shared Notes Collection =====
    match /sharedNotes/{noteId} {
      allow read: if (request.auth != null &&
                    (request.auth.uid == resource.data.ownerId ||
                     request.auth.uid in resource.data.sharedWith)) || isAdmin();
      allow write: if request.auth != null &&
                      request.auth.uid == resource.data.ownerId;
      allow create: if request.auth != null &&
                       request.auth.uid == request.resource.data.ownerId &&
                       validateSharedNoteData(request.resource.data);
    }

    // ===== Admin Collection =====
    match /admins/{adminId} {
      allow read: if request.auth != null && request.auth.uid == adminId;
      allow write: if isAdmin();
    }

    // ===== Admin Dashboard Access =====
    match /users/{document=**} {
      allow read: if isAdmin();
    }
    match /events/{document=**} {
      allow read: if isAdmin();
    }
    match /tasks/{document=**} {
      allow read: if isAdmin();
    }
    match /notes/{document=**} {
      allow read: if isAdmin();
    }
    match /reminders/{document=**} {
      allow read: if isAdmin();
    }

    // ===== Default Deny =====
    match /{document=**} {
      allow read, write: if false;
    }
  }

  // ===== Validation Functions =====
  function validateReminderData() {
    let data = request.resource.data;
    return data.keys().hasAll(['title', 'userId']) &&
           data.title is string && 
           data.title.size() > 0 && 
           data.title.size() <= 200 &&
           data.userId is string && 
           data.userId == request.auth.uid &&
           (!('description' in data) || (data.description is string && data.description.size() <= 1000)) &&
           (!('date' in data) || data.date is string) &&
           (!('time' in data) || data.time is string) &&
           (!('category' in data) || (data.category is string && data.category in ['Today', 'Work', 'Personal', 'Study', 'Health', 'Family', 'Finance', 'Travel'])) &&
           (!('priority' in data) || (data.priority is string && data.priority in ['low', 'medium', 'high'])) &&
           (!('completed' in data) || data.completed is bool) &&
           (!('createdAt' in data) || data.createdAt is timestamp) &&
           (!('updatedAt' in data) || data.updatedAt is timestamp);
  }

  function validateTaskData() {
    let data = request.resource.data;
    return data.keys().hasAll(['title', 'date', 'category', 'userId']) &&
           data.title is string &&
           data.title.size() > 0 && data.title.size() <= 200 &&
           data.date is string &&
           data.date.matches('^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}$') &&
           data.category is string &&
           data.category in ['personal', 'work', 'school'] &&
           data.userId is string &&
           data.userId == request.auth.uid &&
           (!('description' in data) || (data.description is string && data.description.size() <= 1000)) &&
           (!('time' in data) || (data.time is string && data.time.matches('^[0-9]{2}:[0-9]{2}$'))) &&
           (!('completed' in data) || data.completed is bool) &&
           (!('createdAt' in data) || data.createdAt is timestamp) &&
           (!('updatedAt' in data) || data.updatedAt is timestamp);
  }

  function validateEventData(data) {
    return data.keys().hasAll(['title', 'date', 'userId']) &&
           data.title is string &&
           data.title.size() > 0 && data.title.size() <= 200 &&
           data.date is string &&
           data.userId is string &&
           data.userId.size() > 0 &&
           (!('description' in data) || (data.description is string && data.description.size() <= 1000)) &&
           (!('time' in data) || data.time is string) &&
           (!('location' in data) || (data.location is string && data.location.size() <= 200)) &&
           (!('type' in data) || (data.type is string && data.type in ['event', 'meeting', 'appointment', 'reminder'])) &&
           (!('createdAt' in data) || data.createdAt is timestamp) &&
           (!('updatedAt' in data) || data.updatedAt is timestamp);
  }

  function validateUserData(data) {
    return data.keys().hasAll(['email']) &&
           data.email is string &&
           data.email.size() > 0 &&
           data.email.matches('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$') &&
           (!('displayName' in data) || (data.displayName is string && data.displayName.size() <= 100)) &&
           (!('photoURL' in data) || data.photoURL is string) &&
           (!('preferences' in data) || data.preferences is map) &&
           (!('theme' in data) || (data.theme is string && data.theme in ['light', 'dark', 'auto'])) &&
           (!('createdAt' in data) || data.createdAt is timestamp) &&
           (!('lastLoginAt' in data) || data.lastLoginAt is timestamp) &&
           (!('updatedAt' in data) || data.updatedAt is timestamp) &&
           (!('name' in data) || (data.name is string && data.name.size() <= 100)) &&
           (!('profileComplete' in data) || data.profileComplete is bool) &&
           (!('lastLogin' in data) || data.lastLogin is timestamp) &&
           (!('uid' in data) || data.uid is string);
  }

  function validateNoteData(data) {
    return data.keys().hasAll(['content', 'color', 'userId', 'createdAt', 'updatedAt']) &&
           data.content is string &&
           data.content.size() > 0 && data.content.size() <= 5000 &&
           data.color is string &&
           data.color in ['yellow', 'pink', 'blue', 'green', 'purple', 'orange', 'red', 'gray'] &&
           data.userId is string && data.userId.size() > 0;
  }

  function validateSharedNoteData(data) {
    return data.keys().hasAll(['content', 'ownerId', 'sharedWith']) &&
           data.content is string &&
           data.content.size() > 0 && data.content.size() <= 5000 &&
           data.ownerId is string && data.ownerId.size() > 0 &&
           data.sharedWith is list && data.sharedWith.size() <= 50;
  }
}
```
##### 5 Can you Wtach Live Demo
```bash
https://life-app-five.vercel.app
```
- Website Redigsign by Kawdhitha Nirmal-