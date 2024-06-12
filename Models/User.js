import { Schema, model } from 'mongoose';
import { hash } from 'bcrypt';

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    bio: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    avatar: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        }
    }
}, {
    timestamps: true
});

UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        this.password = await hash(this.password, 10);
        next();
    } catch (error) {
        next(error);
    }
});

export const User = model('User', UserSchema);
