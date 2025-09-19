// This file simulates a backend for notifications using localStorage.
// In a real application, these would be API calls to a server.

let notifications = JSON.parse(localStorage.getItem('notifications')) || [];

/**
 * Adds a new notification to the mock database.
 * @param {Object} notification - The notification object.
 * @param {string} notification.recipient - The recipient's email or 'admin'.
 * @param {string} notification.type - The type of notification (e.g., 'new_job', 'opt_in').
 * @param {string} notification.message - The notification message.
 * @param {string} [notification.link] - An optional link for the notification.
 */
export const mockAddNotification = (notification) => {
  const newNotification = {
    id: Date.now(),
    ...notification,
    timestamp: new Date().toISOString(),
    isRead: false
  };
  notifications.push(newNotification);
  localStorage.setItem('notifications', JSON.stringify(notifications));
  console.log('✅ Notification added:', newNotification);
};

/**
 * Fetches notifications for a specific recipient.
 * @param {string} recipient - The recipient's email or 'admin'.
 * @returns {Array} An array of notifications.
 */
export const mockFetchNotifications = (recipient) => {
  return new Promise(resolve => {
    const userNotifications = notifications
      .filter(n => n.recipient === recipient || n.recipient === 'all_students')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    resolve(userNotifications);
  });
};

/**
 * Marks a specific notification as read.
 * @param {number} id - The ID of the notification to mark as read.
 */
export const mockMarkAsRead = (id) => {
  return new Promise(resolve => {
    notifications = notifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    );
    localStorage.setItem('notifications', JSON.stringify(notifications));
    console.log(`✅ Notification ${id} marked as read.`);
    resolve();
  });
};

/**
 * Fetches a student's profile from localStorage.
 * This is a helper function used by the AdminDashboard.jsx mock.
 */
export const mockFetchStudentProfile = (email) => {
  const profiles = JSON.parse(localStorage.getItem('studentProfiles')) || {};
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(profiles[email] || null);
    }, 300);
  });
};
