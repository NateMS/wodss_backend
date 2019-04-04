import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const projectSchema = new Schema({
    name: {
        type: String,
        minlength: 1,
        maxlength: 50,
        required: true
    },

    ftePercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 9223372036854776000
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },

    // todo: Add Reference (block insert if no employee is available)
    // Reference:
    // https://stackoverflow.com/a/26008603/2965122
    projectManagerId: {
        type: Number,
        ref: 'Employee'
    }
});

projectSchema.virtual('id').get(function () { return this._id; });
projectSchema.virtual('id').set(function (i) { this._id = i; });

projectSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    },
});

export default mongoose.model('Project', projectSchema);

/**
 id	integer($int64)     -> todo: maybe changed to String -> Keep ObjectId
     example: 42
     readOnly: true
     minimum: 1
     maximum: 9223372036854776000
     exclusiveMinimum: false
     exclusiveMaximum: false
     Project ID
 name*	string
     example: IP5: Distributed IOT systems
     minLength: 1
     maxLength: 50
     Project name
 ftePercentage*	integer($int64)
     example: 1500
     minimum: 0
     maximum: 9223372036854776000
     exclusiveMinimum: false
     exclusiveMaximum: false

     Full time equivalent represented as a percentage value (1 FTE = 100% = 1 person working 1 day)
 startDate*	string($date)
     example: 2019-03-13

     Project start date (YYYY-MM-DD)
 endDate*	string($date)
     example: 2019-06-13

     Project end date (YYYY-MM-DD)
 projectManagerId*	integer($int64)
     example: 5
     minimum: 1
     maximum: 9223372036854776000
     exclusiveMinimum: false
     exclusiveMaximum: false
     Project manager employee ID
 */
