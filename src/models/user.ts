import BaseModel from './base'

export interface IUser {
  id: number,
  firstName: string,
  secondName: string,
  email: string,
  photoPath: string,
  passwordHash?: string,
  password: string,
}

export interface IUserDB {
  id: number,
  first_name: string,
  second_name: string,
  email: string,
  photo_path: string,
  password_hash: string,
  password: string,
}

const rules = {
  id: 'numeric',
  firstName: 'required|string',
  secondName: 'required|string',
  email: 'required|email',
  photoPath: 'string',
  password: 'string',
  passwordHash: 'string',
}

type ValidationKeys = keyof typeof rules

export default class UserModel extends BaseModel {
  id: number
  firstName: string
  secondName: string
  email: string
  photoPath: string
  passwordHash: string
  password: string

  rules = rules

  constructor (data: IUser) {
    super()
    this.id = data.id
    this.firstName = data.firstName
    this.secondName = data.secondName
    this.email = data.email
    this.photoPath = data.photoPath
    this.passwordHash = data.passwordHash || ''
    this.password = data.password
  }

  validateField (field: ValidationKeys): boolean {
    return super.validateField(field)
  }

  static hashPassword (password: string): string {
    try {
      return require('crypto')
        .createHash('sha256')
        .update(password)
        .digest('hex')
    } catch (err) {
      throw new Error('Password hashing error')
    }
  }

  static comparePassword (password: string, passwordHash: string): boolean {
    try {
      const requestPasswordHash = this.hashPassword(password)
      return requestPasswordHash === passwordHash
    } catch (err) {
      throw new Error('Password compare error')
    }
  }
}
