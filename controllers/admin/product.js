const slug = require("url-slug");
const Product = require("../../models/product");
const Category = require("../../models/category");
const Comment = require("../../models/comment");
const path = require("path");

exports.listProduct = async (req, res, next) => {
  try {
    const categories = await Category.find({});
    const products = await Product.find({});
    // loop
    for (let product of products) {
      const totalComment = await Comment.count({
        slugProduct: product.slugProduct,
      });
      const result = await Comment.aggregate([
        { $match: { slugProduct: product.slugProduct } },
        { $group: { _id: "$slugProduct", totalRating: { $sum: "$rating" } } },
      ]);

      const totalRating = result.length > 0 ? result[0].totalRating : 0;
      product.review_count = totalComment; // lấy ra rồi update thôi

      // tb
      const averageComment = totalRating / totalComment;

      product.average_score = averageComment.toFixed(0);

      product.save();
    }
    // console.log(products);
    res.render("admin/ListProducts", {
      showCategories: categories,
      showProduct: products,
    });
  } catch (error) {
    next(error);
  }
};

exports.addProduct = (req, res, next) => {
  let title = req.body.title;
  let author = req.body.author;
  let price = req.body.price;
  let year = req.body.year;
  let isbn = req.body.isbn;
  let review_count = req.body.review_count;
  let average_score = req.body.average_score;
  let describeProduct = req.body.describeProduct;
  let descriptionProduct = req.body.descriptionProduct;
  let categoryName = req.body.categoryName;

  // Thêm đoạn code để xử lý đường dẫn của file ảnh đã được tải lên
  let image;
  if (req.file) {
    image = "/uploads/" + req.file.filename;
  } else {
    // Nếu không có file ảnh, xử lý theo nhu cầu của bạn
    image = "/default/image/path.jpg"; // Đặt đường dẫn mặc định hoặc xử lý theo yêu cầu
  }

  if (
    title == "" ||
    author == "" ||
    price == "" ||
    year == "" ||
    isbn == "" ||
    average_score == "" ||
    describeProduct == "" ||
    descriptionProduct == "" ||
    categoryName == ""
  ) {
    res.status(200).json({ status: false, message: "Không Được Để Trống" });
  } else {
    const products = new Product({
      title,
      slugProduct: slug(title),
      author,
      price,
      image,
      year,
      isbn,
      review_count: "0",
      average_score,
      describeProduct,
      descriptionProduct,
      categoryName,
    });

    products
      .save()
      .then((result) => {
        res.redirect("/admin/product");
      })
      .catch((err) => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
  }
};

exports.updateProduct = (req, res, next) => {
  let productId = req.params.productId;
  let title = req.body.title;
  let author = req.body.author;
  let price = req.body.price;
  let year = req.body.year;
  let isbn = req.body.isbn;
  let average_score = req.body.average_score;
  let describeProduct = req.body.describeProduct;
  let descriptionProduct = req.body.descriptionProduct;
  let categoryName = req.body.categoryName;
  let slugProduct = slug(title);

  Product.findById(productId)
    .then((data) => {
      // Chỉ cập nhật các trường nếu chúng được cung cấp
      if (title) data.title = title;
      if (author) data.author = author;
      if (price) data.price = price;
      if (year) data.year = year;
      if (isbn) data.isbn = isbn;
      if (average_score) data.average_score = average_score;
      if (describeProduct) data.describeProduct = describeProduct;
      if (descriptionProduct) data.descriptionProduct = descriptionProduct;
      if (categoryName) data.categoryName = categoryName;
      if (title) data.slugProduct = slugProduct;

      let newImage;
      if (req.file) {
        newImage = "/uploads/" + req.file.filename;
        // Cập nhật data.image với đường dẫn hình ảnh mới
        data.image = newImage;
      }

      return data.save();
    })

    .then((result) => {
      res.redirect("/admin/product");
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deleteProduct = (req, res, next) => {
  const productId = req.params.productId;
  Product.deleteOne({ _id: productId })
    .then((post) => {
      if (post.deletedCount > 0) {
        res.status(200).json({
          status: true,
          message: "Xóa sản phẩm thành công",
          productId: productId,
        });
      } else {
        const error = new Error("Không tìm thấy sản phẩm này");
        error.statusCode = 404;
        throw error;
      }
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
