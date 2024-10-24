var express = require("express");
const userController = require("../../controllers/api/user.controller");
var router = express.Router();

router.get("/", userController.profile);
router.get("/transactions", userController.transactions);
router.get("/top-server", userController.topServer);

router.get("/search", userController.searchData);

module.exports = router;
