class PWAUtils {
  constructor() {
    this.isOnline = navigator.onLine
    this.setupNetworkListeners()
    this.setupNotifications()
  }

  // Network status monitoring
  setupNetworkListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true
      this.showNetworkStatus("back online", "success")
      this.syncOfflineData()
    })

    window.addEventListener("offline", () => {
      this.isOnline = false
      this.showNetworkStatus("offline", "warning")
    })
  }

  // Show network status notifications
  showNetworkStatus(status, type) {
    const notification = document.createElement("div")
    const bgColor = type === "success" ? "bg-green-500" : "bg-orange-500"
    const icon = type === "success" ? "fa-wifi" : "fa-wifi-slash"

    notification.className = `fixed top-4 left-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2`
    notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <span class="text-sm font-medium">You are ${status}</span>
        `

    document.body.appendChild(notification)

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 3000)
  }

  // Setup push notifications
  async setupNotifications() {
    if ("Notification" in window && "serviceWorker" in navigator) {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        console.log("[PWA] Notification permission granted")
      }
    }
  }

  // Send local notification
  sendNotification(title, options = {}) {
    if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification(title, {
        icon: "/App.png",
        badge: "/App.png",
        ...options,
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)
    }
  }

  // Sync offline data when back online
  async syncOfflineData() {
    if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready
        await registration.sync.register("background-sync")
        console.log("[PWA] Background sync registered")
      } catch (error) {
        console.error("[PWA] Background sync registration failed:", error)
      }
    }
  }

  // Check if app is installed
  isAppInstalled() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
  }

  // Get app info
  getAppInfo() {
    return {
      isOnline: this.isOnline,
      isInstalled: this.isAppInstalled(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
    }
  }

  // Cache management
  async clearCache() {
    if ("caches" in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
      console.log("[PWA] All caches cleared")
    }
  }

  // Storage quota management
  async getStorageInfo() {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return {
        quota: estimate.quota,
        usage: estimate.usage,
        available: estimate.quota - estimate.usage,
        usagePercentage: Math.round((estimate.usage / estimate.quota) * 100),
      }
    }
    return null
  }
}

// Initialize PWA utilities
const pwaUtils = new PWAUtils()

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = PWAUtils
}
