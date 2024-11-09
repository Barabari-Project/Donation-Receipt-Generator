import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import winston from 'winston';
import routes from './routes/index.js';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import MongoStore from 'connect-mongo';
import path from 'path';

dotenv.config();

const app = express();
const PORT: number = parseInt(process.env.PORT || '3000');

// CORS configuration
app.use(
    cors({
        credentials: true,
        origin: process.env.FRONTEND_BASE_URL, // Ensure this matches your Render frontend URL
    })
);

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration with MongoDB store for production
app.use(
    session({
        secret: process.env.COOKIE_SECRET || 'defaultSecret',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI, // Use MongoDB URI from .env file
            collectionName: 'sessions',
        }),
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'none',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        },
    })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth strategy setup
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            callbackURL: `${process.env.BACKEND_BASE_URL}/auth/google/callback`, // Set to Render backend URL
        },
        (token, tokenSecret, profile, done) => {
            return done(null, profile);
        }
    )
);

// Serialize and Deserialize user
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Logger setup
export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf((data) => `${data.timestamp} ${data.level}: ${data.message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/app.log' }),
    ],
});

// Attach routes
app.use(routes);

// Google OAuth login route
app.get(
    '/auth/google',
    passport.authenticate('google', {
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ],
    })
);

// Google OAuth callback route
app.get('/auth/google/callback', passport.authenticate('google', { session: true }), (req, res) => {
    res.redirect(`${process.env.FRONTEND_BASE_URL}/home`);
});

// Logout route
app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.status(200).json({ message: 'Logged out successfully!' });
    });
});

// User profile route
app.get('/user', (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json(req.user);
});

// Serve static files in production only if client build exists
if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '../client/build');
    if (path.existsSync(clientBuildPath)) {
        app.use(express.static(clientBuildPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(clientBuildPath, 'index.html'));
        });
    }
}

const server = app.listen(PORT, () => {
    logger.info(`Server listening at http://localhost:${PORT}`);
});

// Error-handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(err);
    logger.error(err.message);
    res.status(500).json({ error: 'An unexpected error occurred' });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    server.close(() => {
        process.exit(1);
    });
});
