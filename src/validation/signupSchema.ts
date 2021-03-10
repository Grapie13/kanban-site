import * as Joi from 'joi';

export const signupSchema = Joi.object({
  username: Joi.string().required().min(3).max(20).messages({
    'string.min': 'Username has to be at least 3 characters long',
    'string.max': 'Username cannot exceed 20 characters',
    'string.empty': 'Username cannot be empty',
    'string.base': 'Username must contain at least one character',
    'any.required': 'Username is required',
  }),
  password: Joi.string().required().min(6).max(30).messages({
    'string.min': 'Password has to be at least 6 characters long',
    'string.max': 'Password cannot exceed 30 characters',
    'string.empty': 'Password cannot be empty',
    'string.base': 'Password must contain at least one character',
    'any.required': 'Password is required',
  }),
});
