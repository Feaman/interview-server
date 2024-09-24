import BaseModel from './base'

export interface IAuthor {
  id: number,
  name: string,
}

export interface IAuthorDB {
  id: number,
  name: string,
}

export default class AuthorModel extends BaseModel {
  id: number
  name: string

  static rules = {
    id: 'numeric',
    title: 'required|string',
    text :  'required|string',
  }

  constructor (data: IAuthor) {
    super()
    this.id = data.id
    this.name = data.name
  }
}
