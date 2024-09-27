import BaseModel from './base'

export interface ITemplate {
  id: number,
  title: string,
  data: string,
  isDefault: number,
  userId?: number,
  created: string,
  updated: string,
}

export interface ITemplateDB {
  id: number,
  title: string,
  data: string,
  is_default: number
  user_id: number,
  created: string,
  updated: string,
}

const rules = {
  id: 'numeric',
  title: 'required|string',
  isDefault: 'numeric',
  data: 'required|string',
  userId: 'required|numeric',
}

type ValidationKeys = keyof typeof rules

export default class TemplateModel extends BaseModel {
  id: number
  title: string
  data: string
  isDefault: number
  userId: number
  created: string
  updated: string

  rules = rules

  constructor (data: ITemplate) {
    super()
    this.id = data.id
    this.title = data.title
    this.data = data.data
    this.isDefault = data.isDefault || 0
    this.userId = data.userId || 0
    this.created = data.created
    this.updated = data.updated
  }

  validateField (field: ValidationKeys): boolean {
    return super.validateField(field)
  }
}
