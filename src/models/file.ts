import BaseModel from './base'

export interface IFile {
  id: number,
  name: string,
  mimeType: string,
  path: string,
  size: number,
  userId?: number,
}

export interface IFileDB {
  id: number,
  name: string,
  path: string,
  size: number,
  mime_type: string,
  user_id: number,
}

export default class FileModel extends BaseModel {
  id: number
  name: string
  mimeType: string
  path: string
  size: number

  static rules = {
    id: 'numeric',
    name: 'required|string|max:1024',
    mimeType: 'required|string|max:55',
    size: 'required|numeric',
    path: 'required|string|max:1024',
  }

  constructor (data: IFile) {
    super()
    this.id = data.id
    this.name = data.name
    this.mimeType = data.mimeType
    this.path = data.path
    this.size = data.size
  }
}
