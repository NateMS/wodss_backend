import mongoose from 'mongoose';
import * as bcrypt from "bcrypt";
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

credentialsSchema.methods.comparePassword= function (candidatePassword, callback) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        if(err){return callback(err)}

        callback(null, isMatch)
    })
};

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
