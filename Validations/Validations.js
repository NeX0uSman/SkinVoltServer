import { body } from 'express-validator'

export const registerValidation = [
    body('email', 'Your email doesnt look like it is a one').isEmail(),
    body('password', 'Your password isnt long enough').isLength({ min: 8 }),
    body('name', 'Your name isnt long enough').isLength({ min: 3 }),
    body('avatarUrl', 'The link to the picture is wrong').optional().isURL(),
]

export const loginValidation = [
    body('email', 'Your email doesnt have an account or password is wrong').isEmail(),
    body('password', 'Your password doesnt match').isLength({ min: 8 }),
]