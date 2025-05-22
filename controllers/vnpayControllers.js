const moment = require("moment");
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

exports.orderPayment = (req, res, next) => {
  const { payment } = req.params;
  const { address, phone, comment } = req.body;
  if (
    req.body.address == "" ||
    req.body.phone == "" ||
    req.body.comment == ""
  ) {
    return res.status(200).json({
      status: false,
      message: `Không Được Để Trống`,
    });
  }
  req.session.address = address;
  req.session.phone = phone;
  req.session.comment = comment;

  // Sử dụng res.locals để truyền dữ liệu đến views
  res.locals.address = address;
  res.locals.phone = phone;
  res.locals.comment = comment;
  if (payment === "vnpay") {
    let date = new Date();
    let createDate = moment(date).format("YYYYMMDDHHmmss");

    let ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    const config = {
      vnp_TmnCode: "JXR55KBH",
      vnp_HashSecret: "MQUOBCSKEOCGLLJTJDCCVOXXFGEVTNBI",
      vnp_Url: " https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
      vnp_Api: "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
      vnp_ReturnUrl: "https://book-store-n4xf.onrender.com/ttonline?paymentMethod=vnpay",
    };

    let tmnCode = config.vnp_TmnCode;
    let secretKey = config.vnp_HashSecret;
    let vnpUrl = config.vnp_Url;
    let returnUrl = config.vnp_ReturnUrl;
    let orderId = moment(date).format("DDHHmmss");
    let amount = req.body.totalPrice;
    let bankCode = "";

    let locale = "vn";
    if (locale === null || locale === "") {
      locale = "vn";
    }
    let currCode = "VND";
    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = locale;
    vnp_Params["vnp_CurrCode"] = currCode;
    vnp_Params["vnp_TxnRef"] = orderId;
    vnp_Params["vnp_OrderInfo"] = "Thanh toan cho ma GD:" + orderId;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = amount * 100;
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;
    if (bankCode !== null && bankCode !== "") {
      vnp_Params["vnp_BankCode"] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    let querystring = require("qs");
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;
    vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

    res.status(201).json({ vnpUrl });
  }
  if (payment === "delivery") {
    res.status(201).json({ vnpUrl: "/ttonline?paymentMethod=delivery" });
  }
};
