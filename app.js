// Entry point for Hostinger Node.js
// Hostinger uses cPanel Passenger which looks for app.js or server.js by default.
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '3000';
require('./dist/server.cjs');
