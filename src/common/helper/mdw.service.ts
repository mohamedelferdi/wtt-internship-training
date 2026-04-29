import Joi from 'joi'
import { MObject } from './constants'

class MdwService {
  validateObject(Object: MObject, schema: Joi.Schema) {
    const { error } = schema.validate(Object, { abortEarly: false })
    if (error != null) {
      const msgs = error.details.map((e) => e.message)
      throw `Object inputs : ${msgs}`
    }
  }
}

export default new MdwService()
