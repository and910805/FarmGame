export class NotificationCenter {
  constructor(setNotifications) {
    this.setNotifications = setNotifications;
  }

  push(message) {
    const id = Date.now() + Math.random();
    this.setNotifications(prev => [...prev, { id, message }]);
    setTimeout(() => {
      this.setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }
}

