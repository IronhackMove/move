const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const epointSchema = new Schema({
  name: String,
  location: {
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'], // 'location.type' must be 'Point'
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }
});

const Epoint = mongoose.model('Epoint', epointSchema);
module.exports = Epoint;
