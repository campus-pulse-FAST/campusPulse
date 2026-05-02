export const servicesConfig = () => ({
  services: {
    user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    event: process.env.EVENT_SERVICE_URL || 'http://localhost:3002',
    registration: process.env.REGISTRATION_SERVICE_URL || 'http://localhost:3003',
    feedback: process.env.FEEDBACK_SERVICE_URL || 'http://localhost:3004',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',
  },
});
