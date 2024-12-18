import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import winston from "winston";
import routes from './routes/index.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT: number = parseInt(process.env.PORT || '3000');

app.use(
    cors({
        origin: process.env.FRONTEND_BASE_URL,
        credentials: true, // Allow cookies
    })
);

app.use(express.json());
app.use(cookieParser());


export const logger = winston.createLogger({
    // Log only if level is less than (meaning more severe) or equal to this
    level: "info",
    // Use timestamp and printf to create a standard log format
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(
            (data) => `${data.timestamp} ${data.level}: ${data.message}`
        )
    ),
    // Log to the console and a file
    transports: [
        new winston.transports.Console(),
    ],
});

app.use((req: Request, res: Response, next: NextFunction) => {
    // Log an info message for each incoming request
    logger.info(`Received a ${req.method} request for ${req.url}`);
    next();
});

app.get('/health', (req: Request, res: Response) => {
    res.sendStatus(200);
});

app.use(routes);

const server = app.listen(PORT, () => {
    logger.info(`Server listening at http://localhost:${PORT}`);
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(err);
    logger.error(err.message);
    res.redirect(`${process.env.FRONTEND_BASE_URL}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    // Gracefully close the server and then exit
    logger.error('Uncaught Exception:', err);
    server.close(() => {
        process.exit(1);
    });
});
