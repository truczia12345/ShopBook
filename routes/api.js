const express = require("express");
const router = express.Router();
const apiController = require("../controllers/api");
const Address = require('../models/address');

router.get("/product/:isbn", apiController.apiGetISBN);
router.get("/products", apiController.apiGetProducts);
router.get("/categories", apiController.apiGetCategories);
router.get('/user-addresses', async (req, res) => {
    try {
      const userId = req.session.userID; // Lấy User ID từ session
      const addresses = await Address.find({ user: userId });
      res.json(addresses);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

module.exports = router;
