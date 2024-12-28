import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import winston from "winston";
import routes from './routes/index.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

// Allowlist for CORS
const allowlist = [
    process.env.FRONTEND_BASE_URL1,
    process.env.FRONTEND_BASE_URL2,
];

// CORS options delegate
const corsOptionsDelegate = (req, callback) => {
    const origin = req.header('Origin'); // Get Origin header from the request
    const corsOptions = allowlist.includes(origin) 
        ? { origin: true, credentials: true } // Allow this origin
        : { origin: false }; // Block this origin
    callback(null, corsOptions); // Pass options to CORS middleware
};

// Apply CORS middleware
app.use(cors(corsOptionsDelegate));

// Middleware for JSON and cookies
app.use(express.json());
app.use(cookieParser());

// Logger configuration
export const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(
            (data) => `${data.timestamp} ${data.level}: ${data.message}`
        )
    ),
    transports: [
        new winston.transports.Console(),
    ],
});

// Log all incoming requests
app.use((req, res, next) => {
    logger.info(`Received a ${req.method} request for ${req.url}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.sendStatus(200);
});

// API routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err);
    logger.error(err.message);
    res.status(500).json({ error: err.message });
});

// Start the server
const server = app.listen(PORT, () => {
    logger.info(`Server listening at http://localhost:${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    server.close(() => {
        process.exit(1);
    });
});
