import express, { Request, Response, NextFunction } from 'express'; 
import dotenv from 'dotenv'; 
import cors from 'cors'; 
import winston from "winston"; 
import routes from './routes/index.js'; 
import session from 'express-session'; 
import passport from 'passport'; 
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'; 

dotenv.config();

const app = express();
const PORT: number = parseInt(process.env.PORT || '3000');

app.use(
    cors({
        credentials: true,
        origin: process.env.FRONTEND_BASE_URL // Ensure this is set correctly
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: process.env.COOKIE_SECRET!, // Ensure COOKIE_SECRET is defined
        cookie: {
            secure: process.env.NODE_ENV === "production" ? true : "auto",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000, 
        },
        resave: false,
        saveUninitialized: false,
    })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!, 
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!, 
    callbackURL: '/auth/google/callback' 
}, (accessToken, refreshToken, profile, done) => {
    // Here you might want to save the user to your database if required
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user); 
});

passport.deserializeUser((obj, done) => {
    done(null, obj); 
});

export const logger = winston.createLogger({
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

app.get('/health', (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.sendStatus(200);
});

app.use(routes);

app.get("/auth/google",
    passport.authenticate("google", {
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ]
    })
);

app.get('/auth/google/callback',
    passport.authenticate("google", { session: true }), 
    (req, res) => {
        // Successful authentication, redirect to the frontend's home page.
        res.redirect(`${process.env.FRONTEND_BASE_URL}/home`); // Ensure this matches your frontend route
    }
);

app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.status(200).json({ message: 'Logged out successfully!' });
    });
});

app.get('/user', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json(req.user);
});

const server = app.listen(PORT, () => {
    logger.info(`Server listening at http://localhost:${PORT}`);
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(err); 
    logger.error(err.message); 
    res.redirect(`${process.env.FRONTEND_BASE_URL}`); 
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    server.close(() => { 
        process.exit(1); 
    });
});
