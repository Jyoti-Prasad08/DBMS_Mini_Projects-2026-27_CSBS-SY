const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters.'],
      maxlength: [80, 'Name must be 80 characters or fewer.'],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, 'Email must be 254 characters or fewer.'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required.'],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.set('toJSON', {
  transform: (document, returned) => {
    delete returned.passwordHash;
    delete returned.__v;
    return returned;
  },
});

module.exports = mongoose.model('User', userSchema);
