const random = require("random-token");
const Product = require("../models/product");
const Comment = require("../models/comment");
const Order = require("../models/order");
const User = require("../models/user");
const Category = require("../models/category");
const VnPayModel = require("../models/vnpay");
const Cart = require("../models/cart");

exports.getIndex = async (req, res) => {
  try {
    const categories = await Category.find({});
    const products = await Product.find({});
    res.render("index", { products: products, categories: categories });
  } catch (err) {
    console.log(err);
  }
};

exports.getDetail = async (req, res) => {
  try {
    const slug = req.params.slug;
    const product = await Product.findOne({ slugProduct: slug });
    const categories = await Category.find({});
    const products = await Product.find({});
    const comments = await Comment.find({
      slugProduct: slug, // Bình luận theo slug của sản phẩm
    });
    // console.log("Comments : ", comments);

    res.render("detail", {
      detailProducts: product,
      comments: comments,
      products: products,
      categories: categories,
    });
  } catch (error) {
    console.log(error);
  }
};

// get slug category

exports.getProductOfCategory = async (req, res) => {
  try {
    const slugCate = req.params.slug;
    const productOfCategory = await Product.find({ categoryName: slugCate });
    const categories = await Category.find({});

    if (!productOfCategory) {
      res.status(404).render("404", { pageTitle: "Không tìm thấy sản phẩm" });
    } else {
      res.render("categories", {
        products: productOfCategory,
        categories: categories,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

// post comment

exports.postComment = async (req, res) => {
  if (!req.session.loggedin) {
    return res
      .status(200)
      .json({ status: false, message: "Vui Lòng Đăng Nhập Để Tiếp Tục" });
  } else {
    if (req.body.star == "" || req.body.message == "") {
      res.status(200).json({ status: false, message: "Không Được Để Trống" });
    } else {
      const commentLenght = await Comment.count({
        email: req.session.email,
      });
      console.log(
        "Tổng Comment Của Email : ",
        req.session.email,
        "Là : ",
        commentLenght
      );
      if (commentLenght >= 5) {
        res.json({ status: false, message: "Bình Luận Quá 5 Lần !" });
      } else {
        const comment = new Comment({
          email: req.session.email,
          rating: req.body.star,
          comment: req.body.message,
          slugProduct: req.body.slugProduct,
        });
        comment
          .save()
          .then((result) => {
            
            res.json({ status: true, message: "Bình Luận Thành Công" });
          })
          .catch((error) => {
            console.error(error);
            res
              .status(500)
              .json({ status: false, message: "Lỗi Bình Luận Ròi" });
          });
      }
    }
  }
};

// update comment

exports.updateComment = (req, res, next) => {
  if (!req.session.loggedin) {
    return res.status(200).json({
      status: false,
      message: "Vui Lòng Đăng Nhập Để Tiếp Tục",
    });
  }

  if (req.body.editlistcomment == "") {
    return res.status(200).json({
      status: false,
      message: "Không Được Để Trống",
    });
  }

  Comment.findOne({ _id: req.body.idEditComment, email: req.session.email })
    .then((comment) => {
      if (null) {
        return res.status(200).json({
          status: false,
          message: "Không Tìm Thấy Bình Luận",
        });
      } else {
        comment.comment = req.body.editlistcomment;
        return comment.save();
      }
    })
    .then(() => {
      return res.status(200).json({
        status: true,
        message: "Cập Nhật Bình Luận Thành Công",
      });
    })
    .catch((err) => {
      // console.log(err);
      return res.status(200).json({
        status: false,
        message: "Không Được Edit Bình Luận Của Người Ta!",
      });
    });
};

// delete comment

exports.deleteComment = (req, res) => {
  if (!req.session.loggedin) {
    return res.status(200).json({
      status: false,
      message: "Vui Lòng Đăng Nhập Để Tiếp Tục",
    });
  }
  // console.log(req.body.idDeleteComment);
  // console.log(req.session.email);
  Comment.findOne({ _id: req.body.idDeleteComment, email: req.session.email })
    .then((comment) => {
      console.log(comment); // output : null
      if (null) {
        return res.status(200).json({
          status: false,
          message: "Không Tìm Thấy Bình Luận",
        });
      }

      return Comment.deleteOne({ _id: comment._id });
    })
    .then(() => {
      return res.status(200).json({
        status: true,
        message: "Xóa Bình Luận Thành Công",
      });
    })
    .catch((err) => {
      // console.log('cc',err);
      return res.status(200).json({
        status: false,
        message: "Không Được Xóa Bình Luận Của Người Ta!",
      });
    });
};

// add to cart

exports.addToCart = async (req, res) => {
  try {
    const slug = req.body.slugProduct;
    const quantity = Number(req.body.quantity || 1);

    // Tìm sản phẩm trong cơ sở dữ liệu
    const product = await Product.findOne({ slugProduct: slug });

    if (!product) {
      return res.status(400).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Tìm sản phẩm trong giỏ hàng cơ sở dữ liệu
    const cartItem = await Cart.findOne({
      product_id: product._id,
      user_id: req.session.userID, // Đảm bảo rằng bạn có session với userID
    });

    if (cartItem) {
      // Nếu sản phẩm đã tồn tại trong giỏ hàng, cập nhật số lượng
      cartItem.quantity += quantity;
      await cartItem.save();
    } else {
      // Nếu sản phẩm chưa tồn tại trong giỏ hàng, tạo mới
      await Cart.create({
        product_id: product._id,
        user_id: req.session.userID,
        quantity: quantity,
      });
    }

    // Cập nhật giỏ hàng trong phiên
    let cart = req.session.cart || {
      huydev: {},
      totalQuantity: 0,
      totalPrice: 0,
    };

    if (cart.huydev[product._id]) {
      // Nếu sản phẩm đã tồn tại trong giỏ hàng phiên, cập nhật số lượng
      cart.huydev[product._id].quantity += quantity;
      cart.totalQuantity += quantity;
      cart.totalPrice += Number(product.price) * quantity;
    } else {
      // Nếu sản phẩm chưa tồn tại trong giỏ hàng phiên, thêm mới
      cart.huydev[product._id] = {
        item: product,
        quantity: quantity,
      };
      cart.totalQuantity += quantity;
      cart.totalPrice += Number(product.price) * quantity;
    }

    req.session.cart = cart;

    return res.status(200).json({
      status: true,
      message: "Thêm Sản Phẩm Thành Công",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: "Thêm Sản Phẩm Thất Bại",
    });
  }
};

exports.viewCart = async (req, res) => {
  try {
    const categories = await Category.find({});
    const userCart = await Cart.find({ user_id: req.session.userID })
      .populate("product_id")
      .exec();

    if (!userCart || userCart.length === 0) {
      return res.render("cart", {
        products: [],
        totalPrice: 0,
        categories: categories,
      });
    }

    const products = userCart.map((cartItem) => {
      return {
        item: cartItem.product_id,
        quantity: cartItem.quantity,
      };
    });

    const totalPrice = products.reduce((total, product) => {
      return total + product.item.price * product.quantity;
    }, 0);

    res.locals.products = products;
    res.locals.totalPrice = totalPrice;

    return res.render("cart", {
      categories: categories,
      products: products,
      totalPrice: totalPrice,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Lỗi khi hiển thị giỏ hàng",
    });
  }
};

exports.updateCart = async (req, res) => {
  try {
    const { idProduct, quantity } = req.body;

    // Tìm sản phẩm trong cơ sở dữ liệu
    const product = await Product.findById(idProduct);

    if (!product) {
      return res
        .status(400)
        .json({ status: false, message: "Không tìm thấy sản phẩm" });
    }

    // Cập nhật sản phẩm trong cơ sở dữ liệu
    const cartItem = await Cart.findOneAndUpdate(
      { product_id: product._id, user_id: req.session.userID },
      { $set: { quantity: quantity } },
      { new: true }
    );

    // Cập nhật sản phẩm trong phiên
    let cart = req.session.cart || {
      huydev: {},
      totalQuantity: 0,
      totalPrice: 0,
    };

    if (cart.huydev[product._id]) {
      cart.huydev[product._id].quantity = quantity;
      cart.totalQuantity += parseInt(quantity);
      cart.totalPrice += Number(product.price) * parseInt(quantity);
    }

    req.session.cart = cart;

    return res.status(200).json({
      status: true,
      message: `Cập Nhật Sản Phẩm Với ID [${idProduct}] Thành Công`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: "Lỗi khi cập nhật giỏ hàng",
    });
  }
};

exports.deleteCart = async (req, res) => {
  try {
    const { deleteIDProduct } = req.body;

    // Tìm sản phẩm trong cơ sở dữ liệu
    const product = await Product.findById(deleteIDProduct);

    if (!product) {
      return res
        .status(400)
        .json({ status: false, message: "Không tìm thấy sản phẩm" });
    }

    // Xóa sản phẩm trong cơ sở dữ liệu
    await Cart.findOneAndDelete({
      product_id: product._id,
      user_id: req.session.userID,
    });

    // Xóa sản phẩm trong phiên
    let cart = req.session.cart || {
      huydev: {},
      totalQuantity: 0,
      totalPrice: 0,
    };

    if (cart.huydev[product._id]) {
      cart.totalPrice -= product.price * cart.huydev[product._id].quantity;
      cart.totalQuantity -= cart.huydev[product._id].quantity;
      delete cart.huydev[product._id];
    }

    req.session.cart = cart;

    return res.status(200).json({
      status: true,
      message: `Xóa Sản Phẩm Với ID [${deleteIDProduct}] Thành Công`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: "Lỗi khi xóa sản phẩm từ giỏ hàng",
    });
  }
};

// show view

exports.getviewCheckOut = async (req, res) => {
  try {
    const categories = await Category.find({});
    const user = await User.findOne({ email: req.session.email });

    if (!user) {
      return res
        .status(400)
        .json({ status: false, message: "Không tìm thấy người dùng" });
    }

    const userOrder = {
      fullname: user.fullname,
      email: user.email,
    };

    const cart = await Cart.find({ user_id: user._id })
      .populate("product_id")
      .exec();

    if (!cart || cart.length === 0) {
      return res.render("checkout", {
        categories: categories,
        products: [],
        userOrder: userOrder,
        totalPrice: 0,
      });
    }

    const products = cart.map((cartItem) => {
      return {
        item: cartItem.product_id,
        quantity: cartItem.quantity,
      };
    });

    const totalPrice = products.reduce((total, product) => {
      return total + product.item.price * product.quantity;
    }, 0);

    res.render("checkout", {
      categories: categories,
      products: products,
      userOrder: userOrder,
      totalPrice: totalPrice,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Lỗi khi lấy thông tin đơn hàng từ cơ sở dữ liệu",
    });
  }
};

// odder

const createVnpayPayment = async (orderData) => {
  try {
    const result = await VnPayModel.create({
      vnp_Amount: orderData.vnp_Amount,
      vnp_BankTranNo: orderData.vnp_BankCode,
      vnp_TransactionNo: orderData.vnp_BankTranNo,
    });

    return result._id;
  } catch (error) {
    console.error("Lỗi khi tạo thanh toán Vnpay:", error);
    throw error;
  }
};

const createOrder = async (
  email,
  productsList,
  vnpayID,
  paymentMethod,
  address,
  phone,
  comment
) => {
  try {
    const totalPrice = productsList.reduce((total, product) => {
      return total + product.item.price * product.quantity;
    }, 0);

    const orderData = new Order({
      emailOrder: email,
      codeOrder: random(5).toUpperCase(),
      products: productsList,
      totalPrice: totalPrice,
      status: "Processed",
      paymentMethod: paymentMethod,
      vnpayID: vnpayID,
      address: address,
      phone: phone,
      comment: comment,
    });
    await orderData.save();
  } catch (error) {
    console.error("Lỗi khi tạo đơn hàng:", error);
    throw error;
  }
};

exports.orderCart = async (req, res) => {
  const { email, address, phone, comment } = req.session;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ status: false, message: "Không tìm thấy người dùng" });
    }

    const cart = await Cart.find({ user_id: user._id }).populate("product_id").exec();

    if (!cart || cart.length === 0) {
      return res.status(400).json({ status: false, message: "Giỏ hàng rỗng" });
    }

    const productsList = cart.map((cartItem) => {
      return {
        item: cartItem.product_id.toObject(),
        quantity: cartItem.quantity,
      };
    });

    const vnpayID =
      req.body.paymentMethod === "vnpay"
        ? await createVnpayPayment({
            vnp_Amount: req.body.vnpAmount,
            vnp_BankCode: req.body.vnpBankCode,
            vnp_BankTranNo: req.body.vnpTransactionNo,
          })
        : null;

    await createOrder(email, productsList, vnpayID, req.body.paymentMethod, address, phone, comment);

    // Xóa giỏ hàng sau khi đặt hàng thành công
    await Cart.deleteMany({ user_id: user._id });

    return res.status(200).json({
      status: true,
      message: `Đặt Hàng Với Email [${email}] Thành Công`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: `Đã có lỗi xảy ra trong quá trình đặt hàng.`,
    });
  }
};


// list order
exports.getListOrder = async (req, res) => {
  const categories = await Category.find({});
  const email = req.session.email;
  Order.find({ emailOrder: email })
    .then((order) => {
      // order.products.forEach((product) => {
      //   console.log("Tên sản phẩm:", product.item.title);
      //   console.log("Số lượng:", product.quantity);
      //   console.log("Giá:", product.item.price * product.quantity);
      // });
      res.render("listOrder", { orders: order, categories: categories });
      
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getDetailOrder = async (req, res, next) => {
  const categories = await Category.find({});

  const codeOrder = req.params.codeOrder;
  Order.findOne({ codeOrder: codeOrder })
    .then((huydev) => {
      res.render("listDetailOrder.ejs", {
        detailOrders: huydev,
        categories: categories,
      });
      
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getStatusComplete = (req, res, next) => {
  const idOrder = req.params.id;
  Order.findById(idOrder)
    .then((huyit) => {
      huyit.status = "Complete";
      return huyit.save();
    })
    .then((result) => {
      res.status(200).json({
        status: true,
        message: "Nhận Hàng Thành Công",
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

