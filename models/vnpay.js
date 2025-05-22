const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const paymentVnpaySchema = new Schema({
  vnp_Amount: {
    type: String,
    required: true,
  },
  vnp_BankTranNo: {
    type: String,
    required: true,
  },
  vnp_TransactionNo: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("PaymentVnpay", paymentVnpaySchema);
