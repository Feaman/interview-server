import BaseModel from './base'

export interface ITemplate {
  id: number,
  data: string,
  userId?: number,
}

export interface ITemplateDB {
  id: number,
  data: string,
  user_id: number,
}

const rules = {
  id: 'numeric',
  data: 'required|string',
  userId: 'required|numeric',
}

type ValidationKeys = keyof typeof rules

export default class TemplateModel extends BaseModel {
  id: number
  data: string
  userId: number

  rules = rules

  constructor (data: ITemplate) {
    super()
    this.id = data.id
    this.data = data.data
    this.userId = data.userId || 0
  }

  validateField (field: ValidationKeys): boolean {
    return super.validateField(field)
  }
}
