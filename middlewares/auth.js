const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findOne({ _id: decoded._id });

    if (!user) {
      throw new Error("Unable to login", "Token authentication failed");
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    res.status(400).send({ error: "Invalid Credentials" + err });
  }
};

module.exports = auth;