import BaseModel from './base'

export interface ICandidate {
  id: number,
  firstName: string,
  secondName: string,
  photoPath: string,
  data: string,
  created: string,
}

export interface ICandidateDB {
  id: number,
  first_name: string,
  second_name: string,
  photo_path: string,
  data: string,
  created: string,
}

export default class CandidateModel extends BaseModel {
  id: number
  firstName: string
  secondName: string
  photoPath: string
  data: string
  created: string

  static rules = {
    id: 'numeric',
    firstName: 'required|string',
    secondName: 'required|string',
    data: 'required|string',
    photoPath: 'string',
  }

  constructor (data: ICandidate) {
    super()
    this.id = data.id
    this.firstName = data.firstName
    this.secondName = data.secondName
    this.photoPath = data.photoPath
    this.data = data.data
    this.created = data.created
  }
}
