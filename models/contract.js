import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const contractSchema = new Schema({
    /*_id: {
      type: Number,
      required: true,
      min: 1,
      max: 9223372036854776000
    },*/

    startDate: {
        type: String,
        required: true,
    },

    endDate: {
        type: String,
        required: true,
    },

    pernsumPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },

    employeeId: {
        type: String, // vom MongoDB erzeugter Hash
        required: true,
    }
});

contractSchema.query.inRange = function(fromDate, toDate) {
    if (typeof fromDate !== 'undefined' && typeof toDate === 'undefined') {
        return this.find({ startDate: { $gte: fromDate } });
    } else if (typeof fromDate === 'undefined' && typeof toDate !== 'undefined') {
        return this.find({ endDate: { $lt: toDate } });
    } else if (typeof fromDate !== 'undefined' && typeof toDate !== 'undefined') {
        return this.find({ fromDate: { $gte: fromDate } , endDate: { $lt: toDate } });
    } else {
        return this.find();
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

export default mongoose.model('Contract', contractSchema);

