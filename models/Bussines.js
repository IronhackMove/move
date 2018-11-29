const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const bussinesSchema = new Schema({
  username: String,
  email: String,
  password: String,
  chargingpoints: [{type: Schema.Types.ObjectId, ref: 'chargingpoints'}],
  


}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const Bussines = mongoose.model('Bussines', bussinesSchema);
module.exports = Bussines;
