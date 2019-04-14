import mongoose from 'mongoose';
import * as autoIncrement from "mongoose-auto-increment";
const Schema = mongoose.Schema;

const projectSchema = new Schema({
    _id: {
        type: Number,
        required: true,
        min: 1,
        max: 9223372036854776000
    },

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
        type: String,
        //ref: 'Employee'
    }
}, {_id:false});

projectSchema.statics.findInRange = function(filterStartDate, filterEndDate) {
    //wenn nur fromDate gegeben ist, dann muss startDate>=filterStartDate || startDate<=filterStartDate<=endDate
    if (typeof filterStartDate !== 'undefined' && typeof filterEndDate === 'undefined') {
        return this.find({
            $or: [
                { startDate: { $gte: filterStartDate} },
                { $and: [
                        { startDate: { $lte: filterStartDate },
                            endDate: { $gte: filterStartDate }}
                    ]} ]});
        //wenn nur toDate gegeben ist, dann muss endDate<=filterEndDate || startDate<=filterEndDate<=endDate
    } else if (typeof filterStartDate === 'undefined' && typeof filterEndDate !== 'undefined') {
        return this.find({
            $or: [
                { endDate: { $lte: filterEndDate} },
                { $and: [
                        { startDate: { $lte: filterEndDate },
                            endDate: { $gte: filterEndDate }}
                    ]} ]});
        //wenn fromDate und toDate gegeben ist, dann muss startDate zwischen filterStartDate und filterEndDate liegen
        //oder endDate zwischen filterStarrDate und filterEndDate
    } else if (typeof filterStartDate !== 'undefined' && typeof filterEndDate !== 'undefined') {
        return this.find({
            $or: [
                { $and: [
                        { startDate: { $gte: filterStartDate }},
                        { startDate: { $lte: filterEndDate }} ]},
                { $and: [
                        { endDate: { $gte: filterStartDate }},
                        { endDate: { $lte: filterEndDate }} ]},
                { $and: [
                        { startDate: { $lte: filterStartDate }},
                        { endDate:   { $gte: filterEndDate }} ]}
            ]});
    } else { //wenn gar keine Limitierungen gesetzt sind
        return this.find(); //max 100 zurückgeben?
    }
}

projectSchema.virtual('id').get(function () { return this._id; });
projectSchema.virtual('id').set(function (i) { this._id = i; });

projectSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    },
});

autoIncrement.initialize(mongoose.connection);
projectSchema.plugin(autoIncrement.plugin, "Project");

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
