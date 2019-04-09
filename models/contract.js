import mongoose from 'mongoose';
import * as autoIncrement from "mongoose-auto-increment";
const Schema = mongoose.Schema;

const contractSchema = new Schema({
    _id: {
      type: Number,
      required: true,
      min: 1,
      max: 9223372036854776000
    },

    startDate: {
        type: String,
        required: true,
    },

    endDate: {
        type: String,
        required: true,
    },

    pensumPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },

    employeeId: {
        type: String,
        required: true,
    }
}, {_id:false} );

contractSchema.statics.findInRange = function(filterStartDate, filterEndDate) {
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

contractSchema.virtual('id').get(function () { return this._id; });
contractSchema.virtual('id').set(function (i) { this._id = i; });

contractSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    },
});

autoIncrement.initialize(mongoose.connection);
contractSchema.plugin(autoIncrement.plugin, "Contract");

export default mongoose.model('Contract', contractSchema);