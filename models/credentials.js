import mongoose from 'mongoose';
import * as autoIncrement from "mongoose-auto-increment";
const Schema = mongoose.Schema;

const credentialsSchema = new Schema({
    emailAddress: {
        type: String,
        minlength: 1,
        maxlength: 120,
        unique: true,
    },

    password: {
        type: String,
    },
});

credentialsSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
        delete ret.password;
    },
});

export default mongoose.model('Credentials', credentialsSchema);
/**
 active:
 type: boolean
 id:
 type: integer todo: maybe String
 firstName:
 type: string
 lastName:
 type: string
 emailAddress:
 type: string
 role:
 type: string
 enum:
 - ADMINISTRATOR
 - PROJECTMANAGER
 - DEVELOPER
 */
