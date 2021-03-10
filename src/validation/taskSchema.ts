import * as Joi from 'joi';

export const taskSchema = Joi.object({
  name: Joi.string().required().max(255).messages({
    'string.max': 'Name cannot exceed 255 characters',
    'string.empty': 'Name cannot be empty',
    'any.required': 'Name is required',
  }),
  stage: Joi.string().valid('TODO', 'DOING', 'DONE').default('TODO').messages({
    'any.only': 'Stage has to be one of the following: TODO, DOING, DONE',
  }),
  token: Joi.string(),
});
