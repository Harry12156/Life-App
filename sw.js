const CACHE_NAME = "life-app-v1.0.0"
const STATIC_CACHE = "life-static-v1.0.0"
const DYNAMIC_CACHE = "life-dynamic-v1.0.0"

// Files to cache immediately
const STATIC_FILES = [
  "/",
  "/index.html",
  "/about.html",
  "/login.html",
  "/register.html",
  "/forgot-password.html",
  "/Todo.html",
  "/calendar.html",
  "/reminders.html",
  "/features.html",
  "/review.html",
  "/dashboard.html",
  "/App.png",
  "/imeges/Life Logo.png",
  "/imeges/Hom Page/Hero Image.png",
  "/imeges/Login/Login Image.png",
  "/imeges/About Us/About Us Image.png",
  "/imeges/Footer/Life Logo.png",
  "/manifest.json",
  "https://cdn.tailwindcss.com",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css",
  "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Kalam:wght@400;700&display=swap",
]

// Firebase files to cache
const FIREBASE_FILES = [
  "https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js",
  "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js",
]

// Install event - cache static files
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...")

  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log("[SW] Caching static files...")
        return cache.addAll(STATIC_FILES)
      }),
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log("[SW] Caching Firebase files...")
        return cache.addAll(FIREBASE_FILES)
      }),
    ])
      .then(() => {
        console.log("[SW] Installation complete")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("[SW] Installation failed:", error)
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...")

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log("[SW] Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("[SW] Activation complete")
        return self.clients.claim()
      }),
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Skip Firebase Auth and Firestore requests
  if (
    url.hostname.includes("firebase") ||
    url.hostname.includes("googleapis") ||
    url.hostname.includes("identitytoolkit") ||
    url.hostname.includes("firestore")
  ) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log("[SW] Serving from cache:", request.url)
        return cachedResponse
      }

      // Network first for HTML pages
      if (request.headers.get("accept").includes("text/html")) {
        return fetch(request)
          .then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone()
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseClone)
              })
            }
            return response
          })
          .catch(() => {
            // Return offline page if available
            return caches.match("/index.html")
          })
      }

      // Cache first for other resources
      return fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          console.log("[SW] Network failed, serving from cache:", request.url)
          return new Response("Offline content not available", {
            status: 503,
            statusText: "Service Unavailable",
          })
        })
    }),
  )
})

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag)

  if (event.tag === "background-sync") {
    event.waitUntil(
      // Handle offline actions when back online
      handleBackgroundSync(),
    )
  }
})

// Push notification handler
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received")

  const options = {
    body: event.data ? event.data.text() : "New notification from Life App",
    icon: "/App.png",
    badge: "/App.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Open App",
        icon: "/App.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/App.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("Life App", options))
})

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.action)

  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"))
  }
})

// Handle background sync
async function handleBackgroundSync() {
  try {
    // Handle any offline actions stored in IndexedDB
    console.log("[SW] Handling background sync...")
    // Add your offline action handling logic here
  } catch (error) {
    console.error("[SW] Background sync failed:", error)
  }
}

// Message handler for communication with main thread
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data)

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
