const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Signup
// Signup
exports.signup = async (req, res) => {
  const { email, farmName, password } = req.body;
  if (!email || !farmName || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ email, farmName, password });

    res.status(201).json({
      _id: user._id,
      email: user.email,
      farmName: user.farmName,
      token: generateToken(user._id)
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Duplicate email, try another one" });
    }
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "All fields are required" });

  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        email: user.email,
        farmName: user.farmName,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Profile
exports.getProfile = async (req, res) => {
  res.json(req.user);
};
