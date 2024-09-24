import Validator from 'validatorjs'

type Rules = {[field: string]: string}

export default class BaseModel {

  rules: Rules = {}

  validate (): boolean {
    const validation = new Validator(this, this.rules)
    return !!validation.passes()
  }

  validateField (field: string): boolean {
    const validation = new Validator(this, { [field]: this.rules[field]})
    return !!validation.passes()
  }
}
