const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartSchema = new Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    product_id: {type: mongoose.Schema.Types.ObjectId, ref: "Products"},
    quantity: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Cart", cartSchema);
