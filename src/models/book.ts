import { IAuthor } from './author';
import BaseModel from './base';
export interface IBook {
  id: number,
  title: string,
  assessment: number,
  audio: number,
  binder: number;
  communicator: number;
  phone: number;
  author_id: number,
  author?: IAuthor,
  created: string,
}

export interface IBookDB {
  id: number,
  title: string,
  assessment: number,
  audio: number,
  binder: number;
  communicator: number;
  phone: number;
  author_id: number,
  author_name: string,
  name: string;
  created: string,
}

export default class BookModel extends BaseModel {
  id: number
  title: string
  assessment: number
  audio: number
  binder: number
  communicator: number
  phone: number
  author_id: number
  author?: IAuthor
  created: string

  static rules = {
    id: 'numeric',
    title: 'required|string',
    assessment :  'number',
    audio:  'number',
    author_id:  'number|string',
    binder:  'number',
    communicator:  'number',
    phone:  'number',
  }

  constructor (data: IBook) {
    super()
    this.id = data.id
    this.title = data.title
    this.assessment = data.assessment
    this.audio= data.audio
    this.binder= data.binder
    this.communicator= data.communicator
    this.phone= data.phone
    this.created = data.created
    this.author_id= data.author_id
    if (data.author) {
      this.author = data.author
    }
  }
}
