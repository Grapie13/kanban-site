import * as Joi from 'joi';

export const taskSchema = Joi.object({
  name: Joi.string().required().max(255).messages({
    'string.max': 'Name cannot exceed 255 characters',
    'any.required': 'Name is required',
  }),
  stage: Joi.string().allow('TODO', 'DOING', 'DONE').default('TODO'),
  token: Joi.string(),
});
