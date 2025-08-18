const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../models');
const { User, UserVariable } = db;

// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    // Insert user variables
    const firstName = name.split(' ')[0] || name;
    const lastName = name.split(' ').slice(1).join(' ') || '';

    const variablesToInsert = [
      { variableName: 'first_name', variableValue: firstName },
      { variableName: 'last_name', variableValue: lastName },
      { variableName: 'full_name', variableValue: name },
      { variableName: 'email', variableValue: email },
      { variableName: 'offer_link', variableValue: `https://navilead.com/offer/:quoteId` },
    ];

    await UserVariable.bulkCreate(
      variablesToInsert.map(v => ({ ...v, userId: user.id }))
    );

    // Prepare user data (exclude password)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    };

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '6h' }
    );

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: userData,
    });

  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Email already registered.' });
    }
    res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
};




// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '6h' }
    );

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    };

    res.status(200).json({ message: 'Logged in successfully.', token, user: userData });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
};


// LOGOUT
exports.logout = async (req, res) => {
  try {
    // On frontend: remove token (localStorage/cookies)
    // Here, just respond with a success message
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout.', error: error.message });
  }
};
