var express = require("express");
var router = express.Router();
const userRouter = require("./user/apiUser");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.json("hello api");
});

router.use("/user", userRouter);

module.exports = router;
