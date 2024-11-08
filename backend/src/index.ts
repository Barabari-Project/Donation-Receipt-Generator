import express, { Request, Response, NextFunction } from 'express'; // Imports Express framework and required types
import dotenv from 'dotenv'; // Imports dotenv to manage environment variables
import cors from 'cors'; // Imports CORS to handle cross-origin requests
import winston from "winston"; // Logger for tracking errors and server info
import routes from './routes/index.js'; // Importing routes from the routes folder
import session from 'express-session'; // Importing session management middleware
import passport from 'passport'; // Passport for handling authentication
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'; // Google OAuth strategy for login
import path from 'path'; // Path module for handling file paths

// Initialize environment variables
dotenv.config();

// Create an instance of the Express app
const app = express();
// Set the port for the server using an environment variable
const PORT: number = parseInt(process.env.PORT || '3000');

// CORS configuration to allow cross-origin requests from the frontend
app.use(
    cors({
        credentials: true,
        origin: process.env.FRONTEND_BASE_URL // Frontend base URL for CORS
    })
);

// Middleware to parse JSON request bodies
app.use(express.json());
// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Session middleware for managing user sessions
app.use(
    session({
        secret: [process.env.COOKIE_SECRET], // Secret key for sessions from .env file
        cookie: {
            secure: process.env.NODE_ENV === "production" ? true : "auto", // Secure cookies for production only
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Cross-site cookie setting
            maxAge: 30 * 24 * 60 * 60 * 1000, // Set cookie expiry time for 30 days
        },
        resave: false, // Do not force session save on every request
        saveUninitialized: false, // Do not save uninitialized sessions
    })
);

// Initialize Passport for authentication
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport with Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID, // Google client ID from .env
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Google client secret from .env
    callbackURL: '/auth/google/callback' // URL where Google sends user back after login
}, (accessToken, refreshToken, profile, done) => {
    // Passport callback after successful login, sending user profile to done()
    return done(null, profile);
}));

// Serialize user into session after successful login
passport.serializeUser((user, done) => {
    done(null, user); // Store entire user object in session
});

// Deserialize user from session on subsequent requests
passport.deserializeUser((obj, done) => {
    done(null, obj); // Retrieve user from session
});

// Logger setup using Winston to log both console and file
export const logger = winston.createLogger({
    level: "info", // Log levels set to "info"
    format: winston.format.combine(
        winston.format.timestamp(), // Adds timestamp to logs
        winston.format.printf(
            (data) => `${data.timestamp} ${data.level}: ${data.message}` // Log format
        )
    ),
    transports: [
        new winston.transports.Console(), // Log to console
        new winston.transports.File({ filename: "logs/app.log" }), // Log to file
    ],
});

// Middleware to log incoming requests using Winston
app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`Received a ${req.method} request for ${req.url}`); // Logs the request method and URL
    next(); // Pass control to the next middleware
});

// Health check route, checking if user is authenticated
app.get('/health', (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' }); // Send 401 if user is not authenticated
    }
    res.sendStatus(200); // Send OK if user is authenticated
});

// Attach all routes defined in the routes folder
app.use(routes);

// Route to handle Google OAuth login
app.get("/auth/google",
    passport.authenticate("google", {
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile', // Request access to profile info
            'https://www.googleapis.com/auth/userinfo.email' // Request access to email info
        ]
    })
);

// Google OAuth callback route after login
app.get('/auth/google/callback',
    passport.authenticate("google", { session: true }), // Authenticate the user and manage session
    (req, res) => {
        res.redirect(`${process.env.FRONTEND_BASE_URL}`); // Redirect user to frontend after login
    }
);

// Route to handle user logout
app.get('/logout', (req, res, next) => {
    req.logout((err) => { // Use Passport's logout method
        if (err) return next(err); // If error, pass it to the next middleware
        res.status(200).json({ message: 'Logged out successfully!' }); // Respond with success
    });
});

// Route to get the logged-in user's profile
app.get('/user', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' }); // Send 401 if not authenticated
    }
    res.json(req.user); // Send user profile data if authenticated
});

// Serve static files from the React app
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build'))); // Serve static files from the React app

    // The "catchall" handler: for any request that doesn't match one above, send back index.html.
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build/index.html'));
    });
}

// Start the server and log that it is running
const server = app.listen(PORT, () => {
    logger.info(`Server listening at http://localhost:${PORT}`); // Log server start message
});

// Error-handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(err); // Log the error
    logger.error(err.message); // Log the error message
    res.redirect(`${process.env.FRONTEND_BASE_URL}`); // Redirect to frontend on error
});

// Handle uncaught exceptions and gracefully shut down the server
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err); // Log uncaught exception
    server.close(() => { // Gracefully close the server
        process.exit(1); // Exit process with failure code
    });
});