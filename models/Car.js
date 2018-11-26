const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const carSchema = new Schema({
  brand: {type:String, enum:["Tesla", "BMW", "Audi", "BYD", "Hyundai", "Jaguar", "Nissan", "Opel", "Renault", "Volkswagen"]},
  model: {type:String, enum:["Tesla Model X", "Tesla Model 3", "Tesla Model S", "BMW i8", "BMW i3", "Audi e-tron", "BYD E6 400", "Hyundai Kona", "Hyundai Ioniq", "Jaguar I-Pace", "Nissan LEAF", "Opel Ampera-e"]},
  autonomy: Number
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const Car = mongoose.model('Car', carSchema);
module.exports = Car;
