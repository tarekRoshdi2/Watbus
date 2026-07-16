// Entry point for Hostinger Node.js
// Hostinger uses cPanel Passenger which looks for app.js or server.js by default.
process.env.NODE_ENV = 'production';
require('./dist/server.cjs');
