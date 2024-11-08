import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// User type structure for your custom user
interface User {
  emails: { value: string }[];
  // other fields here
}

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', ''); // Extract the token

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload; 

    // Now check if decoded matches the User structure
    if (decoded && (decoded as User).emails) {
      req.user = decoded as User; // If decoded is of type User, assign to req.user
      next(); // Continue processing
    } else {
      return res.status(401).json({ error: 'Invalid token structure' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
