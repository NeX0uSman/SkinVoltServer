import mongoose from 'mongoose'

const adminSchema = new mongoose.Schema({
    role: {
        type: String,
        default: 'admin'
    },
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
    },
    inviteCodeRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InviteCode',
        default: null,
    }
}, {
    timestamps: true,
}
)

export default mongoose.model('Admin', adminSchema)