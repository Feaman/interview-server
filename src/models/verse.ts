import BaseModel from './base'

export interface IVerse {
  id: number,
  title: string,
  text: string,
  created: string,
}

export interface IVerseDB {
  id: number,
  title: string,
  text: string,
  created: string,
}

export default class VerseModel extends BaseModel {
  id: number
  title: string
  text: string
  created: string

  static rules = {
    id: 'numeric',
    title: 'required|string',
    text :  'required|string',
  }

  constructor (data: IVerse) {
    super()
    this.id = data.id
    this.title = data.title
    this.text = data.text
    this.created = data.created
  }
}
