import mongoose from 'mongoose'

const accountSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    avatarUrl: {
        type: String
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 1000,
    },
    inventory: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Skin',
        default: []
    }
}, {
    timestamps: true,
}
)

export default mongoose.model('User', accountSchema)