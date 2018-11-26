const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const bussinesSchema = new Schema({
  street: String,
  number: String,
  cp: String,
  city: String, 
  longitud: Number,
  latitude: Number,
});

const Bussines = mongoose.model('Bussines', bussinesSchema);
module.exports = Bussines;
