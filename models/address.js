const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const addressSchema = new Schema({
  street: {
    type: String,
    required: true,
  },
  commune: {
    type: String,  // Thêm trường cho xã (phường)
    required: true,
  },
  district: {
    type: String,  // Thêm trường cho huyện
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  // Thêm trường UserID để liên kết với người dùng
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

module.exports = mongoose.model("Address", addressSchema);
