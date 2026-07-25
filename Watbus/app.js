// Entry point for Hostinger Node.js
process.env.NODE_ENV = 'production';
const fs = require('fs');

process.on('uncaughtException', (err) => {
    fs.appendFileSync('startup-error.log', new Date().toISOString() + ' Uncaught Exception: ' + (err.stack || err) + '\n');
});

process.on('unhandledRejection', (reason) => {
    fs.appendFileSync('startup-error.log', new Date().toISOString() + ' Unhandled Rejection: ' + (reason.stack || reason) + '\n');
});

try {
    require('./dist/server.cjs');
} catch (error) {
    fs.appendFileSync('startup-error.log', new Date().toISOString() + ' Startup Crash: ' + (error.stack || error) + '\n');
    throw error;
}
