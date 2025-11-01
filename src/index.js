require('dotenv').config();
const express = require('express');
const client = require('./config/whatsapp');
const { handleMessage: handleFyp } = require('./handlers/fypHandler');
const { handleMessage: handlePdf } = require('./handlers/pdfsHandler');

console.log('🚀 WhatsApp Agent starting...');
console.log('📍 Environment:', process.env.NODE_ENV || 'development');

// Create Express app for health checks
const app = express();
const PORT = process.env.PORT || 3000;

let isClientReady = false;

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        whatsappConnected: isClientReady,
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        service: 'WhatsApp Agent',
        status: 'running',
        whatsappConnected: isClientReady
    });
});

// Start Express server
app.listen(PORT, () => {
    console.log(`🌐 Health check server running on port ${PORT}`);
});

// Register message handler with error handling
client.on('message', async (msg) => {
    try {
        const pdfHandled = await handlePdf(msg); // First check PDF handler
        
        // Only call AI handler if PDF handler didn't handle the message
        if (!pdfHandled) {
            await handleFyp(msg); 
        }
    } catch (error) {
        console.error('❌ Error handling message:', error.message);
        console.error('Stack:', error.stack);
    }
});

// Update ready status
client.on('ready', () => {
    isClientReady = true;
});

client.on('disconnected', () => {
    isClientReady = false;
});

// Handle errors
client.on('error', (error) => {
    console.error('❌ WhatsApp Client Error:', error);
});

// Initialize WhatsApp client
client.initialize().catch((error) => {
    console.error('❌ Failed to initialize WhatsApp client:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⚠️  Shutting down gracefully...');
    try {
        await client.destroy();
        console.log('✅ Client disconnected successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    console.log('\n⚠️  Received SIGTERM, shutting down...');
    try {
        await client.destroy();
        console.log('✅ Client disconnected successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
});
