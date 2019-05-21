import mongoose from 'mongoose';
import * as autoIncrement from "mongoose-auto-increment";
const Schema = mongoose.Schema;

const employeeSchema = new Schema({
  active: {
    type: Boolean,
  },

  firstName: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50,
  },

  lastName: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50,
  },

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

  role: {
    type: String,
    enum: ['ADMINISTRATOR', 'PROJECTMANAGER', 'DEVELOPER'],
  },
});

employeeSchema.virtual('id').get(function () { return this._id; });
employeeSchema.virtual('id').set(function (i) { this._id = i; });

employeeSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  },
});

//autoIncrement.initialize(mongoose.connection);
//employeeSchema.plugin(autoIncrement.plugin, "Employee");

export default mongoose.model('Employee', employeeSchema);
