export class NotificationCenter {
  constructor(setNotifications) {
    this.setNotifications = setNotifications;
    this.timeouts = new Map();
  }

  push(message, { type = 'info', duration = 4000 } = {}) {
    const id = Date.now() + Math.random();
    this.setNotifications(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      const timeoutId = setTimeout(() => {
        this.dismiss(id);
      }, duration);
      this.timeouts.set(id, timeoutId);
    }
  }

  dismiss(id) {
    const timeoutId = this.timeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(id);
    }

    this.setNotifications(prev => prev.filter(notification => notification.id !== id));
  }

  clear() {
    this.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.timeouts.clear();
    this.setNotifications([]);
  }
}

