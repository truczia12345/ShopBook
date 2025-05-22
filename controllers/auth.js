const User = require("../models/user");
const random = require("random-token");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const Category = require("../models/category");

exports.createUser = (req, res, next) => {
  const { fullname, password, repassword, email } = req.body;
  if (fullname == "" || password == "" || repassword == "" || email == "") {
    res.status(200).json({ status: false, message: "Không Được Để Trống" });
  } else {
    if (password !== repassword) {
      return res
        .status(200)
        .json({ status: false, message: "Mật khẩu nhập lại không khớp!" });
    } else {
      // Mã hóa mật khẩu
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          return res.status(500).json({
            status: false,
            message: "Có lỗi xảy ra trong quá trình mã hóa mật khẩu",
          });
        }
        var token = random(24);
        const users = new User({
          fullname,
          password: hash,
          email,
          token: token,
        });
        users
          .save()
          .then((result) => {
            res.status(201).json({
              status: true,
              message: "Đăng Ký Thành Công",
            });
          })
          .catch((err) => {
            if (!err.statusCode) {
              err.statusCode = 500;
            }
            next(err);
          });
      });
    }
  }
};

exports.loginUser = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(200)
      .json({ status: false, message: "Không Được Để Trống" });
  }

  
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(200).json({
          status: false,
          message: "Tài khoản không tồn tại",
        });
      }

      // So sánh mật khẩu đã mã hóa với mật khẩu người dùng nhập vào
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            status: false,
            message: "Có lỗi xảy ra trong quá trình đăng nhập",
          });
        }
        
        if (result) {
          req.session.loggedin = true;
          req.session.email = email;
          res.locals.email = email;
          req.session.userID = user._id;
          console.log(res.locals.email);
          return res.status(200).json({
            status: true,
            message: "Đăng nhập thành công",
          });
        } else {
          return res
            .status(200)
            .json({ status: false, message: "Đăng nhập thất bại" });
        }
      });
    })
    .catch((err) => {
      console.error(err);
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getForgotPassword = (req, res, next) => {
  res.render("auth/forgot-password");
};

exports.postForgotPassword = (req, res, next) => {
  const { email } = req.body;
  let resetToken; // Di chuyển khai báo lên đầu hàm

  // Tạo mã xác nhận (reset token)
  resetToken = crypto.randomBytes(20).toString("hex"); // Di chuyển gán giá trị vào đây

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.send(`
          <script>
            alert("Email không tồn tại. Vui lòng kiểm tra lại!");
            window.location.href = "/forgot-password";
          </script>
        `);
      }

      // Lưu mã xác nhận vào cơ sở dữ liệu
      user.resetToken = resetToken;
      return user.save();
    })
    .then((result) => {
      // Gửi email với mã xác nhận
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "dinhtrinh5678@gmail.com ",
          pass: "oamdcbbrfbesdwdx",
        },
      });

      const mailOptions = {
        from: "Cửa hàng BookShop <dinhtrinh5678@gmail.com>",
        to: email,
        subject: "Khôi phục mật khẩu",
        html: `
        <p>Xin chào,</p>
        <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn.</p>
        <p>Vui lòng nhấn vào nút dưới đây để tiếp tục quá trình đặt lại mật khẩu:</p>
        <button style="background-color: #4CAF50; /* Green */
          border: none;
          color: white;
          padding: 15px 32px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 13px;
          border-radius:15px;"
        >
          <a href="http://localhost:3333/reset-password/${resetToken}" style="color: white; text-decoration: none;">
            Đặt lại mật khẩu
          </a>
        </button>
        <p>Nếu bạn không thực hiện yêu cầu này, bạn có thể bỏ qua thư này.</p>
        <p>Trân trọng,</p>
        <p>Đội ngũ hỗ trợ của chúng tôi</p>
        
        `,
      };
      

      return transporter.sendMail(mailOptions);
    })
    .then((info) => {
      res.status(200).json({
        status: true,
        message: "Email đã được gửi với hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra email"
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ status: false, message: "Có lỗi xảy ra" });
    });
};


exports.getResetPassword = async (req, res, next) => {
  const resetToken = req.params.resetToken;
  const categories = await Category.find({});

  // Kiểm tra tính hợp lệ của mã xác nhận
  User.findOne({
    resetToken: resetToken,
  })
    .then((user) => {
      console.log("User:", user); // Log giá trị user để kiểm tra
      if (!user) {
        return res
          .status(400)
          .json({ status: false, message: "Mã xác nhận không hợp lệ" });
      }

      // Hiển thị trang để người dùng nhập mật khẩu mới
      res.render("auth/reset-password", { resetToken: resetToken, categories: categories });
    })
    .catch((err) => {
      res.status(500).json({ status: false, message: "Có lỗi xảy ra" });
    });
};

exports.postResetPassword = (req, res, next) => {
  const resetToken = req.body.resetToken;
  const newPassword = req.body.newPassword;

  if (!newPassword || newPassword.trim() === "") {
    return res
      .status(400)
      .json({ status: false, message: "Mật khẩu mới không hợp lệ" });
  }

  bcrypt
    .hash(newPassword, 10)
    .then((hashedPassword) => {
      console.log("hashedPassword", hashedPassword);
      return User.findOneAndUpdate(
        { resetToken: resetToken },
        { $set: { password: hashedPassword, resetToken: "" } },
        { new: true } 
      );
    })
    .then((updatedUser) => {
      console.log(updatedUser)
      if (!updatedUser) {
        return res.status(400).json({ status: false, message: "Mã xác nhận không hợp lệ" });
      }
    
      // Gửi phản hồi thành công
      res.status(200).json({ status: true, message: "Đặt mật khẩu thành công" });
    })
    .catch((err) => {
      console.error(err);
      res
        .status(500)
        .json({
          status: false,
          message: "Có lỗi xảy ra khi cập nhật mật khẩu",
        });
    });
};
