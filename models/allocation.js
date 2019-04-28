import mongoose from 'mongoose';
import * as autoIncrement from "mongoose-auto-increment";
const Schema = mongoose.Schema;

const allocationSchema = new Schema({
    _id: {
        type: Number,
        required: true,
        min: 1,
        max: 9223372036854776000
    },

    startDate: {
        type: Date,
        required: true,
    },

    endDate: {
        type: Date,
        required: true,
    },

    pensumPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },

    contractId: {
        type: Number,
        ref: 'Contract',
        required: true,
    },

    projectId: {
        type: Number,
        ref: 'Project',
        required: true
    }
}, {_id:false} );

//zur Abfrage in einem Time-Range
allocationSchema.statics.findInRange = function(filterStartDate, filterEndDate) {
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
    } else {
        return this.find();
    }
}

allocationSchema.virtual('id').get(function () { return this._id; });
allocationSchema.virtual('id').set(function (i) { this._id = i; });

allocationSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    },
});

autoIncrement.initialize(mongoose.connection);
allocationSchema.plugin(autoIncrement.plugin, "Allocation");

export default mongoose.model('Allocation', allocationSchema);

