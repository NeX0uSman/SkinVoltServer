import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import UserModel from '../Schemas/UserSchema.js'
import ItemSchema from '../Schemas/ItemSchema.js';
import dotenv from 'dotenv';

dotenv.config();

export const balanceCheck = async (userId, cost) => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) return { ok: false, message: 'user not found' }
        if (user.balance >= cost) {
            return { ok: true, message: 'balance is enough to purchase the skin.Purchasing...' }
        } else {
            return { ok: false, message: 'balance isnt enough to purchase the skin.' }
        }
    } catch (err) {
        return { ok: false, message: 'server error' }
    }
}