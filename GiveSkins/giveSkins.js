import mongoose from 'mongoose';
import UserModel from '../Schemas/UserSchema.js';
import Skin from '../Schemas/ItemSchema.js';
import dotenv from 'dotenv';

async function giveRandomSkinsToAllUsers() {

    await mongoose.connect(process.env.MONGO_URI, {
    dbName: 'test',
});

    try {
        const users = await UserModel.find({});
        const skins = await Skin.find({});
        console.log(users)
        console.log(skins)

        if (skins.length < 2) {
            console.log('Not enough skins to give.');
        }
        for (const user of users) {
            if (!Array.isArray(user.inventory)) user.inventory = [];
            if (user.inventory.length > 0) {
                console.log(`User ${user.name} already has skins, skipping.`);
                continue;
            }
            const randomSkins = skins.sort(() => 0.5 - Math.random()).slice(0, 2);

            user.inventory = randomSkins.map(skin => skin._id);
            await user.save();
            console.log(`Gave skins to user ${user.name}`);
        }
        console.log('Скрипт завершён ✅')
        process.exit()
    } catch (err) {
        console.log('Error giving skins to users:', err);
        process.exit(1);
    }
}
giveRandomSkinsToAllUsers();
