// controllers/addressController.js
const Address = require("../models/address");
const Category = require("../models/category");
const mongoose = require("mongoose");

exports.getUserAddresses = async (req, res) => {
  try {
    const categories = await Category.find({});
    const userId = req.session.userID; // Lấy User ID từ session
   
    const addresses = await Address.find({ user: userId });
    res.render("user-addresses", {
      addresses: addresses,
      categories: categories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getAddressesPage = async (req, res) => {
  try {
    const categories = await Category.find({});
    // Lấy danh sách địa chỉ từ cơ sở dữ liệu
    const addresses = await Address.find().populate("user");
    res.render("addresses", { addresses, categories: categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Trong phương thức thêm địa chỉ
exports.addAddress = async (req, res) => {
  try {
    // Lấy thông tin địa chỉ và User ID từ body của request
    const { street, commune, district, city } = req.body;
    const userId = req.session.userID;

    // Tạo đối tượng địa chỉ
    const newAddress = new Address({
      street,
      commune,
      district,
      city,
      user: userId, // Liên kết địa chỉ với User ID
    });

    // Lưu địa chỉ vào cơ sở dữ liệu
    await newAddress.save();

    // Gửi thông báo JSON về máy khách
    res.status(200).json({ message: "Địa chỉ đã được thêm thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi Nội Server" });
  }
};

exports.getEditAddressPage = async (req, res) => {
  try {
    const addressId = req.params.id;
    const address = await Address.findById(addressId);

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    const categories = await Category.find({});
    res.render("edit-address", { address, categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Trong phương thức cập nhật địa chỉ sau khi sửa
exports.editAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const { street, commune, district, city} = req.body;

    // Update the address in the database
    await Address.findByIdAndUpdate(addressId, {
      street,
      commune,
      district,
      city,
      
    });

    // Send a JSON response indicating success
    res.status(200).json({ success: true, message: "Cập nhật địa chỉ thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// Trong phương thức xóa địa chỉ
exports.deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id;

    // Thực hiện xóa trong cơ sở dữ liệu
    await Address.findOneAndDelete({ _id: addressId });

    // Gửi phản hồi JSON cho biết thành công
    res.status(200).json({ success: true, message: "Xóa địa chỉ thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi Nội bộ của máy chủ" });
  }
};



