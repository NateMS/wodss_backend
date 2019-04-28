import mongoose from 'mongoose';
import * as bcrypt from "bcrypt";
const Schema = mongoose.Schema;

const credentialsSchema = new Schema({
    emailAddress: {
        type: String,
        minlength: 1,
        maxlength: 120,
        unique: true,
        validate: {
            validator: function(email) {
                let re1 = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                let re2 = /.*@invalid.ch/; //prevent invalidationerror after anonymizing the employee
                return re1.test(String(email).toLowerCase()) || re2.test(String(email).toLowerCase());
            },
            message: 'You must provide a valid email address.'
        }
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
