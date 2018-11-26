const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const epointSchema = new Schema({
  type: String,
  geometry: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: {
        type: [Number],
      }
    },
    properties: {
      stationName: {type: String, require: true},
      totalDocks: {type: Number}
    }
})

const Epoint = mongoose.model('Epoint', epointSchema);
module.exports = Epoint;
