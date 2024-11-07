import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import winston from "winston";
import routes from './routes/index.js';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import path from 'path';

dotenv.config();

const app = express();
const PORT: number = parseInt(process.env.PORT || '3000');

// CORS configuration to allow cross-origin requests from the frontend
app.use(
    cors({
        credentials: true,
        origin: process.env.FRONTEND_BASE_URL, // Ensure this URL is correctly set
    })
);
console.log('CORS setup complete');

// Parse incoming JSON and URL encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log('Body parsers set up');

// Session middleware for managing user sessions
app.use(
    session({
        secret: process.env.COOKIE_SECRET!,
        cookie: {
            secure: process.env.NODE_ENV === "production", // Automatically secure cookies in production
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        },
        resave: false,
        saveUninitialized: false,
    })
);
console.log('Session middleware added');

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());
console.log('Passport initialized');

// Configure Passport with Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: '/auth/google/callback', // Ensure this is the correct callback URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Google OAuth callback:', profile); // Debugging profile
        const user = {
            id: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
        };

        return done(null, user);
    } catch (error) {
        console.error('Error during Google OAuth callback:', error); // Debugging error
        return done(error, null);
    }
}));

// Serialize and deserialize user to store in session
passport.serializeUser((user, done) => {
    console.log('Serializing user:', user); // Debugging serialized user
    done(null, user); // Ensure the user object is being stored in the session correctly
});

passport.deserializeUser((obj, done) => {
    console.log('Deserializing user:', obj); // Debugging deserialized user
    done(null, obj); // Ensure the user is retrieved correctly from the session
});

// Logger setup using Winston
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf((data) => `${data.timestamp} ${data.level}: ${data.message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "logs/app.log" }),
    ],
});

app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`Received a ${req.method} request for ${req.url}`);
    next();
});

// Health check route
app.get('/health', (req: Request, res: Response) => {
    console.log('Health check route accessed'); // Debugging health check
    if (!req.user) {
        console.log('Unauthorized access to health check'); // Debugging unauthorized
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.sendStatus(200);
});

// Attach routes
app.use(routes);
console.log('Routes attached');

// Google OAuth login route
app.get("/auth/google", passport.authenticate("google", {
    scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ]
}));
console.log('Google OAuth login route added');

// Google OAuth callback route
app.get('/auth/google/callback',
    passport.authenticate("google", { session: true }),
    (req, res) => {
        console.log('Google OAuth callback success:', req.user); // Debugging successful login
        res.redirect(`${process.env.FRONTEND_BASE_URL}`);
    }
);

// Route to handle logout
app.get('/logout', (req, res, next) => {
    console.log('Logout route accessed'); // Debugging logout
    req.logout((err) => {
        if (err) return next(err);
        res.status(200).json({ message: 'Logged out successfully!' });
    });
});

// Route to get the logged-in user's profile
app.get('/user', (req, res) => {
    console.log('User profile route accessed'); // Debugging user profile access
    if (!req.user) {
        console.log('Unauthorized access to user profile'); // Debugging unauthorized
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json(req.user);
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
    app.get('*', (req, res) => {
        console.log('Serving React app'); // Debugging React app serving
        res.sendFile(path.join(__dirname, '../client/build/index.html'));
    });
}

// Start server
const server = app.listen(PORT, () => {
    logger.info(`Server listening at http://localhost:${PORT}`);
    console.log(`Server listening at http://localhost:${PORT}`); // Debugging server start
});

// Error-handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(err);
    console.error('Error occurred:', err); // Debugging errors
    res.redirect(`${process.env.FRONTEND_BASE_URL}`);
});

// Graceful shutdown on uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    console.error('Uncaught Exception:', err); // Debugging uncaught exception
    server.close(() => { process.exit(1); });
});
