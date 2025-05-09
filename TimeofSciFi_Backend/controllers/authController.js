const User = require("../models/user"); 
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, username: newUser.username },
      process.env.JWT_SECRET || require('../routes/userRoutes').JWT_CONFIG.secret,
      { algorithm: 'HS256', expiresIn: '100y' }
    );

    res.json({ message: "Registration successful!", token });
  } catch (error) {
    console.error("Error during registration:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};




const login = async (req, res) => {
  const { email, password } = req.body;  

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || require('../routes/userRoutes').JWT_CONFIG.secret,
      { algorithm: 'HS256', expiresIn: '100y' }
    );

    res.json({ message: "Login successful!", token });
  } catch (error) {
    console.error("Error during login:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  login,
  register,
};
