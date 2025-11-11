const mongoose = require('mongoose')

const skinSchema = new mongoose.Schema({
    name: String,
    price: Number,
    rarity: String,
    weapon: String,
    float: Number,
    imageUrl: String,
    wear: String,
    special: String,
    category: {
        type: String,
        required: true,
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    saleHistory: [
        {
            date: Date,
            price: Number,
        }
    ],
    status: {
        type: String,
        enum: ['inventory', 'selling'],
        default: 'inventory',
    }
})

module.exports = mongoose.model("Skin", skinSchema) 