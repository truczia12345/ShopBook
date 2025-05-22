const slug = require("url-slug");
const Comment = require("../../models/comment");
const Product = require("../../models/product");

exports.listComment = async (req, res, next) => {
  try {
    const comments = await Comment.find({}).lean();
    const showComment = await Promise.all(
      comments.map(async (comment) => {
        const product = await Product.findOne({
          slugProduct: comment.slugProduct,
        }).lean();
        // console.log(product.title);
        if (product) {
          return { ...comment, productName: product.title };
        } else {
          // Handle the case where the product is not found (null)
          return { ...comment, productName: "Product not found" };
        }
      })
    );
    // console.log(showComment);
    res.render("admin/ListComment", { showComment });
  } catch (err) {
    next(err);
  }
};

exports.deleteComment = (req, res, next) => {
  const commentID = req.params.cmtId;
  Comment.deleteOne({ _id: commentID })
    .then((post) => {
      if (post.deletedCount > 0) {
        // Include a script in the response to show an alert
        const script = `<script>alert("Xóa Đánh Giá Thành Công"); window.location.href = '/admin/listComment';</script>`;
        res.status(200).send(script);
      } else {
        const error = new Error("Không tìm thấy Đánh Giá này");
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

