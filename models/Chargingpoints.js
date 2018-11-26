const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const chargingpoints = new Schema({
  street: String,
  number: String,
  cp: String,
  city: String, 
  longitud: Number,
  latitude: Number,

  chargingpoints: Number,
  Power: {type:String, enum:["Normal 3,7kW", "Fast 7,3kW", "Very Fast 50kW"]},
}); 

const Chargingpoints = mongoose.model('Chargingpoints', chargingpoints);
module.exports = Chargingpoints;
