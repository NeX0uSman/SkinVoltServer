import express from 'express'
import mongoose from 'mongoose'
import multer from 'multer'
import Skin from './Schemas/ItemSchema.js'
import cors from 'cors'
import { registerValidation, loginValidation } from './Validations/Validations.js'
import handleErrors from './handleErrors/handleErrors.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import UserModel from './Schemas/UserSchema.js'
import * as UserController from './AuthController/AuthFunctions.js'
import dotenv from 'dotenv';
import { balanceCheck } from './PurchaseController/PuchaseFunctions.js'

dotenv.config();


const app = express()
const port = process.env.PORT || 3000;
const allowedOrigins = [
    'http://localhost:5173',
    'https://skinvoltfront.onrender.com'
];

app.use(express.json());
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
}));

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("DB okay"))
    .catch((err) => console.log(`error connecting to DB: ${err}`))
mongoose.set('bufferTimeoutMS', 60000); // 60 секунд вместо 10
mongoose.set('strictQuery', true);
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));
mongoose.connection.once('open', () => console.log('MongoDB connection open'));

app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
    destination: (_, __, cb) => {
        cb(null, 'uploads')
    },
    filename: (_, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`
        cb(null, uniqueName)
    },
})

const upload = multer({ storage });


app.get('/skins/all', async (req, res) => {
    try {
        const skins = await Skin.find({ status: 'selling' })
        res.json(skins)
    } catch (err) {
        console.log('error answering skins/all' + err)
        res.status(404).json({
            text: 'error fetching skins/all'
        })
    }
})

app.get('/skins/:id', async (req, res) => {
    try {
        const skin = await Skin.findById(req.params.id)
        if (!skin) {
            return res.status(404).json({ message: 'Skin not found' });
        }
        res.json(skin)
    } catch (err) {
        console.log(err)
        res.status(404).json({
            message: 'error fetching skin'
        })
    }
})
app.get('/skins/category/:categoryName', async (req, res) => {

    const categoryName = req.params.categoryName;

    try {
        const skins = await Skin.find({ category: categoryName });
        if (!skins) {
            return res.status(404).json({ message: 'Skins fopr this category not found' })
        }
        res.json(skins)
    } catch (err) {
        console.log(err)
        res.status(404).json({
            message: 'error fetching category'
        })
    }
})

app.get('/random', async (req, res) => {
    try {
        const skins = await Skin.aggregate([{ $sample: { size: 8 } }]);
        res.status(200).json(skins);
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'error fetching random skins'
        })
    }
})

app.post('/client/register/send', registerValidation, handleErrors, UserController.register)

app.post('/client/login/send', loginValidation, handleErrors, UserController.login)

app.post('/skins/upload', UserController.verifyClientToken, upload.single('image'), async (req, res) => {
    try {
        const { name, price, rarity, weapon, wear, float, special } = req.body;

        function autoDetectCategory(weapon) {
            if (['AK-47', 'M4A4', 'M4A1-S', 'FAMAS', 'Galil AR', 'AUG', 'SG 553', 'SSG 08', 'AWP', 'SCAR-20', 'G3SG1'].includes(weapon)) return 'Rifles';
            if (['Glock-18', 'USP-S', 'P2000', 'P250', 'Desert Eagle', 'R8 Revolver', 'Five-SeveN', 'CZ75-Auto', 'Dual Berettas', 'Tec-9'].includes(weapon)) return 'Pistols';
            if (['MAC-10', 'MP7', 'MP9', 'MP5-SD', 'UMP-45', 'P90', 'PP-Bizon'].includes(weapon)) return 'SMGs';
            if (['Nova', 'XM1014', 'MAG-7', 'Sawed-Off', 'M249', 'Negev'].includes(weapon)) return 'Heavy';
            if (weapon.includes('Knife')) return 'Knives';
            if (weapon.includes('Gloves')) return 'Gloves';
            if (weapon.includes('Agent')) return 'Agents';
            if (weapon.includes('Case') || weapon.includes('Container')) return 'Containers';
            if (weapon.includes('Sticker')) return 'Stickers';
            if (weapon.includes('Keychain')) return 'Keychains';
            if (weapon.includes('Patch')) return 'Patches';
            if (weapon.includes('Music Kit')) return 'Music Kits';
            if (weapon.includes('Pin')) return 'Collectibles';

            return 'Other';
        }

        const category = autoDetectCategory(weapon);

        const skin = new Skin({
            name,
            price,
            rarity,
            float,
            weapon,
            imageUrl: `/uploads/${req.file.filename}`,
            wear,
            special,
            category,
            ownerId: req.userId,
            status: 'selling',
        })

        await skin.save()

        res.status(201).json({
            message: 'Successfully added new skin to the DB!',
            skin,
        })
    } catch (err) {
        console.log(`upload error, ${err}`)
        res.status(500).json({
            message: `couldnt add the skin, ${err}`
        })
    }
})

app.delete('/skins/unlist/:id', async (req, res) => {
    try {
        const id = req.params.id;

        const result = await Skin.findById(id);
        if (!result) {
            console.log('Skin with id' + id + ' not found for unlisting');
        }
        result.status = 'inventory';
        await result.save();

        res.status(200).json({
            message: 'skin unlisted successfully',
        })
    } catch (err) {
        console.log()
    }
})

app.post('/skins/list/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { price } = req.body;

        const result = await Skin.findById(id);
        if (!result) {
            console.log('Skin with id' + id + ' not found for listing');
        }
        result.status = 'selling';
        result.price = price;
        await result.save();

        res.status(200).json({
            message: 'skin listed successfully',
        })
    } catch (err) {
        console.log()
    }
})

//purchase logic and sale history adding
app.post('/skins/purchase', UserController.verifyClientToken, async (req, res) => {
    try {
        const { skinId, salePrice } = req.body;
        const buyerId = req.userId;
        const skin = await Skin.findById(skinId);
        const skinOwnerId = skin.ownerId;

        const balanceOk = await balanceCheck(buyerId, salePrice)
        if (!balanceOk.ok) {
            return res.status(400).json({ success: false, message: balanceCheck.message });
        }

        
        if (!skin) {
            return res.status(404).json({ message: 'Skin not found' });
        }


        if (skinOwnerId.toString() === buyerId.toString()) {
            return res.status(400).json({ message: 'Dummy. YOU cannot purchase your own skin' });
        }
        skin.saleHistory.push({ date: new Date(), price: salePrice });
        skin.ownerId = buyerId;
        skin.status = 'inventory';
        await skin.save();

        await UserModel.updateOne(
            {
                _id: buyerId
            },
            {
                $addToSet: { inventory: skin._id },
                $inc: { balance: -salePrice }
            }
        );
        await UserModel.updateOne(
            {
                _id: skinOwnerId
            },
            {
                $pull: { inventory: skin._id },
                $inc: { balance: +salePrice }
            }
        );

        res.status(200).json({ success: true, message: 'Purchase successful' });
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'error processing purchase'
        })
    }
})
app.get('/client/me', UserController.verifyClientToken, async (req, res) => {
    try {
        const user = await UserModel.findById(req.userId).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'error fetching user data' })
    }
});

app.get('/admin/verify', UserController.verifyAdminToken, async (req, res) => {
    res.status(200).json({ message: "Token is valid" })
})//admin token verify for AdminPage

app.get('/client/verify', UserController.verifyClientToken, async (req, res) => {
    res.status(200).json({ message: "Token is valid" })
})//admin token verify for AdminPage

app.post('/skins/getByIds', async (req, res) => {
    try {
        const { ids } = req.body;
        const skins = await Skin.find({ _id: { $in: ids } });
        res.status(200).json(skins);
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'error fetching skins by ids'
        });
    }
})

app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`)
})