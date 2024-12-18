import { Request, Response, NextFunction, Router } from "express";
import decryptData from "../utils/decryptData.js";
import { readDataAndSendMailForRaksha, readDataAndSendMailForSOS } from "../utils/readDataAndSendMail.js";
import axios from 'axios';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/auth/google', async (req: Request, res: Response) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ error: 'No credential provided' });
    }

    try {
        // Verify Google token with Google API
        const googleResponse = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        const { email, name, picture } = googleResponse.data;

        if (!email || !name || !picture) {
            return res.status(400).json({ error: 'Invalid token data' });
        }

        // Generate JWT token
        const token = jwt.sign({ email, name }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Set token in HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            maxAge: 3600000, // 1 hour
        });

        res.status(200).json({ message: 'Login successful', token, email });
    } catch (error) {
        console.error('Error verifying Google token:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

router.get('/user', (req: Request, res: Response) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        // Verify JWT token
        const { email } = jwt.verify(token, process.env.JWT_SECRET) as { email: string; name: string };
        res.status(200).json({ email });
    } catch (error) {
        console.error('Error verifying JWT:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

router.post('/logout', (req: Request, res: Response) => {
    res.clearCookie(
        'token',
        {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 0,
        }
    );
    res.status(200).json({ message: 'Logged out successfully' });
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const encryptedData = req.body.encryptedData;
    const {
        startingRowNo,
        fileData,
        ccEmails,
        password } = decryptData(encryptedData);
    const email = req.user?.emails?.[0]?.value;
    if (!email) {
        return res.status(400).json({ error: 'User email not found' });
    }
    try {
        if (email == process.env.SOS_EMAIL) {
            await readDataAndSendMailForSOS(startingRowNo, fileData, email, ccEmails, password);
        } else if (email == process.env.RAKSHA_EMAIL) {
            await readDataAndSendMailForRaksha(startingRowNo, fileData, email, ccEmails, password);
        } else {
            return res.status(400).json({ message: 'Invalid email address' });
        }
        return res.status(200).json({ message: 'Mails sended successfully!' });
    } catch (error) {
        next(error); // Pass the error to the error handling middleware
    }
});

export default router;