import BaseModel from './base'

export interface IFile {
  id: number,
  name: string,
  originalName: string,
  mimeType: string,
  path: string,
  size: number,
  userId?: number,
}

export interface IFileDB {
  id: number,
  name: string,
  original_name: string,
  path: string,
  size: number,
  mime_type: string,
  user_id: number,
}

export default class FileModel extends BaseModel {
  id: number
  name: string
  originalName: string
  mimeType: string
  path: string
  size: number

  static rules = {
    id: 'numeric',
    name: 'required|string|max:1024',
    origin: 'required|string|max:1024',
    mimeType: 'required|string|max:55',
    size: 'required|numeric',
    path: 'required|string|max:1024',
  }

  constructor (data: IFile) {
    super()
    this.id = data.id
    this.name = data.name
    this.originalName = data.originalName
    this.mimeType = data.mimeType
    this.path = data.path
    this.size = data.size
  }
}
