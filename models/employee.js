import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const employeeSchema = new Schema({
  active: {
    type: Boolean,
  },

  _id: {
    type: Number,
    required: true,
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
  },

  role: {
    type: String,
    enum: ['ADMINISTRATOR', 'PROJECTMANAGER', 'DEVELOPER'],
  },

  password: {
    type: String,
  },
});

employeeSchema.virtual('id').get(function () { return this._id; });
employeeSchema.virtual('id').set(function (i) { this._id = i; });

employeeSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.password;
  },
});

export default mongoose.model('Employee', employeeSchema);

/**
active:
        type: boolean
      id:
        type: integer
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