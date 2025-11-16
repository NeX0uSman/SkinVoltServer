import mongoose from 'mongoose';
import UserModel from '../Schemas/UserSchema.js';
import Skin from '../Schemas/ItemSchema.js';
import InviteCode from '../Schemas/CodeSchema.js'
import Admin from '../Schemas/AdminSchema.js'
import dotenv from 'dotenv';
import { json } from 'express';
import crypto from 'crypto'
dotenv.config()

async function createInviteCode() {
    await mongoose.connect(process.env.MONGO_URI, {
        dbName: 'test',
    });
    try {
        const code = crypto.randomBytes(6).toString('hex');

        const invite = await InviteCode.create({
            code,
            used: false,
        })

        console.log('code created successfully', code)
        process.exit(0)
    } catch (err) {
        console.log(err);
        process.exit(1)
    }

}
createInviteCode()
