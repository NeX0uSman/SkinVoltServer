import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import UserModel from '../Schemas/UserSchema.js'
import InviteCode from '../Schemas/CodeSchema.js'
import Admin from '../Schemas/AdminSchema.js'
import dotenv from 'dotenv';


dotenv.config();

export const register = async (req, res) => {
    try {
        const password = req.body.password;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt)

        const doc = new UserModel({
            email: req.body.email,
            name: req.body.name,
            avatarUrl: req.body.avatarUrl,
            passwordHash: hash,
        })

        const user = await doc.save();

        const token = jwt.sign(
            { _id: user._id, username: user.name, role: user.role },
            process.env.JWT_SECRET,
            {
                expiresIn: '15d'
            }
        );

        const { passwordHash, ...userData } = user._doc;

        res.status(202).json({
            ...userData,
            token
        })
    } catch (err) {
        console.log(err)
        res.status(400).json({
            message: 'couldnt register a new user'
        })
    }
}

export const login = async (req, res) => {
    try {

        const user = await UserModel.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }

        const isPasswordValid = await bcrypt.compare(req.body.password, user._doc.passwordHash);
        if (!isPasswordValid) {
            return res.status(404).json({
                message: 'Login or password is incorrect'
            })
        }

        const token = jwt.sign({
            _id: user._id, username: user.name, role: user.role
        },
            process.env.JWT_SECRET,
            {
                expiresIn: '15d',
            });

        const { passwordHash, ...userData } = user._doc;

        res.status(200).json({
            ...userData,
            token,
        })

    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Server error during login'
        })
    }
}

export const adminRegister = async (req, res) => {
    try {
        const password = req.body.password;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt)
        const inviteCode = req.body.inviteCode;

        const codeDoc = await InviteCode.findOne({ code: inviteCode, used: false })
        if (!codeDoc) return res.status(400).json({ message: 'registration failed' })

        const doc = new Admin({
            email: req.body.email,
            name: req.body.name,
            avatarUrl: req.body.avatarUrl,
            passwordHash: hash,
            inviteCodeID: codeDoc._id
        })
        codeDoc.used = true;
        await codeDoc.save();
        const admin = await doc.save();

        const token = jwt.sign(
            { _id: admin._id, username: admin.name, role: admin.role },
            process.env.JWT_SECRET,
            {
                expiresIn: '15d'
            }
        );

        const { passwordHash, ...adminData } = admin._doc;

        res.status(202).json({
            ...adminData,
            token
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'couldnt register a new admin'
        })
    }
}

export const adminLogin = async (req, res) => {
    try {

        const admin = await Admin.findOne({ email: req.body.email });
        if (!admin) {
            return res.status(404).json({
                message: 'Login or password is incorrect'
            })
        }
        const isPasswordValid = await bcrypt.compare(req.body.password, admin._doc.passwordHash);
        if (!isPasswordValid) {
            return res.status(404).json({
                message: 'Login or password is incorrect'
            })
        }

        const token = jwt.sign({
            _id: admin._id, username: admin.name, role: admin.role
        },
            process.env.JWT_SECRET,
            {
                expiresIn: '15d',
            });

        const { passwordHash, ...adminData } = admin._doc;

        res.status(200).json({
            ...adminData,
            token,
        })

    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Server error during login'
        })
    }
}

export const verifyClientToken = (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(403).json({ message: 'No client token provided, authorization required' });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Failed to authenticate the token' });
        }
        if (decoded.role == 'admin' || decoded.role == 'client') {
            req.userId = decoded._id;
            req.role = decoded.role;
            return next()
        }
        res.status(403).json({ message: 'access forbidden' })
    })
}

export const verifyAdminToken = (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(403).json({ message: 'No admin token provided, authorization required' });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Failed to authenticate the token' });
        }
        if (decoded.role == 'admin') {
            req.userId = decoded._id;
            req.role = decoded.role;
            return next()
        }
        res.status(403).json({ message: 'access forbidden' })
    })
}