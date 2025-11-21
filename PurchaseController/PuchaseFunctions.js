import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import UserModel from '../Schemas/UserSchema.js'
import Admin from '../Schemas/AdminSchema.js'
import ItemSchema from '../Schemas/ItemSchema.js';
import dotenv from 'dotenv';

dotenv.config();

export const balanceCheck = async (userId, cost, role = 'client') => {
    try {
        const Model = role == 'admin' ? Admin : UserModel;
        const user = await Model.findById(userId);
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