import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { BadRequestError, validateRequest } from '@aktickets027/common';
import { User } from '../models/user';
import { PasswordManager } from '../services/password-manager';
import Jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/api/users/signin', [
    body('email')
        .isEmail()
        .withMessage('Email must be valid'),
    body('password')
        .trim()
        .notEmpty()
        .withMessage('You must supply a password.')
],
    validateRequest,
    async (req: Request, res: Response) => {
        const { email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            throw new BadRequestError('Invalid credentials.');
        }

        const passwordsMatch = await PasswordManager.compare(existingUser.password, password);

        if (!passwordsMatch) {
            throw new BadRequestError('Invalid credentials.');
        }

        // Generate json web token.
        const userJwt = Jwt.sign({
            id: existingUser.id,
            email: existingUser.email
        }, process.env.JWT_KEY!);

        // Store it on the session
        req.session = {
            jwt: userJwt
        };

        res.status(200).send(existingUser);

    });
export { router as signinRouter };