import { Router } from "express";
import decryptData from "../utils/decryptData.js";
import { readDataAndSendMailForRaksha, readDataAndSendMailForSOS } from "../utils/readDataAndSendMail.js";
import axios from 'axios';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/auth/google', async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ error: 'No credential provided' });
    }

    try {
        // Verify Google token with Google API
        const googleResponse = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        const { email } = googleResponse.data;
 
        if (!email  ) {
            return res.status(400).json({ error: 'Invalid token data' });
        }
      
        // Generate JWT token
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful', token, email });
    } catch (error) {
        console.error('Error verifying Google token:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});
const authMiddleware = (req, res, next) => {
    const token = req.headers?.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    console.log(token)
    try {
        const { email } = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { email };
        next();
    } catch (error) {
        console.error('Error verifying JWT:', error.message);

        res.status(401).json({ error: 'Invalid token' });
    }
}
router.get('/user', authMiddleware, (req, res) => {
    const { email } = req.user;
    res.status(200).json({ email });
});

router.post('/', authMiddleware, async (req, res, next) => {

    const encryptedData = req.body.encryptedData;
    const {
        startingRowNo,
        fileData,
        ccEmails,
        password } = decryptData(encryptedData);
    const email = req.user.email;
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