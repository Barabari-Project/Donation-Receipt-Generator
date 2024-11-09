import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import winston from 'winston';
import routes from './routes/index.js';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import path from 'path';

dotenv.config();

const app = express();
const PORT: number = parseInt(process.env.PORT || '3000');

// CORS configuration
app.use(
    cors({
        credentials: true,
        origin: process.env.FRONTEND_BASE_URL, // Use frontend URL for Render
    })
);


// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
// Session configuration
app.use(
    session({
        secret: process.env.COOKIE_SECRET || 'defaultSecret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production', // Use HTTPS cookies only in production
            httpOnly: true, // Prevent client-side access to cookies
            sameSite: 'none', // Allow cookies across origins (required for third-party auth)
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        },
    })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth strategy setup
// Google OAuth strategy setup
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            callbackURL: `${process.env.VITE_BACKEND_BASE_URL}/auth/google/callback`, // Use Render backend URL here
        },
        (token, tokenSecret, profile, done) => {
            return done(null, profile);
        }
    )
);


// Serialize and Deserialize user
passport.serializeUser((user, done) => {
    done(null, user); // Store user object in session
});

passport.deserializeUser((user, done) => {
    done(null, user); // Retrieve user from session
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
    res.redirect(`${process.env.FRONTEND_BASE_URL}/home`); // Redirect to frontend after auth
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
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json(req.user); // Should return the authenticated user's profile
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build/index.html'));
    });
}

const server = app.listen(PORT, () => {
    logger.info(`Server listening at http://localhost:${PORT}`);
});

// Error-handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(err);
    logger.error(err.message);
    res.redirect(`${process.env.FRONTEND_BASE_URL}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    server.close(() => {
        process.exit(1);
    });
});
