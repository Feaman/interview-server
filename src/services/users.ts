import { MysqlError, OkPacket } from 'mysql'
import UserModel, { IUser, IUserDB } from '~/models/user'
import BaseService from '~/services/base'

const fs = require('fs')

export default class UsersService extends BaseService {
  static async create (userData: IUser): Promise<UserModel> {
    const existentUser = await this.findByEmail(userData.email)
    if (existentUser) {
      throw new Error('User with such an email is already exists')
    }

    return UsersService.save(new UserModel(userData))
  }

  static async update (data: IUser, currentUser: UserModel): Promise<UserModel> {
    const user = await this.findById(String(currentUser.id))
    if (!user) {
      throw new Error('User not found')
    }

    try {
      if (data.photoPath && user.photoPath) {
        fs.unlinkSync(user.photoPath)
      }
    } catch (error) {
      console.error(error)
    }

    user.email = data.email
    user.password = data.password
    user.firstName = data.firstName
    user.secondName = data.secondName
    if (data.photoPath) {
      user.photoPath = data.photoPath 
    }

    return this.save(user)
  }

  static async login (userData: IUser): Promise<UserModel> {
    const user = await this.findByEmail(userData.email)
    if (!user) {
      throw new Error('Wrong email or password')
    }

    if (!UserModel.comparePassword(userData.password, user.passwordHash)) {
      throw new Error('Wrong email or password')
    }
    user.passwordHash = ''
    return user
  }

  static findById (id: string): Promise<UserModel | null> {
    return this.findByField('id', id)
  }

  static findByEmail (email: string): Promise<UserModel | null> {
    return this.findByField('email', email)
  }

  static async findByField (fieldName: string, fieldValue: string): Promise<UserModel | null> {
    return new Promise((resolve, reject) => {
      this.pool.query({
        sql: `select * from users where ${fieldName} = ?`,
        values: [fieldValue],
      },
      (error: MysqlError, usersDBData: IUserDB[]) => {
        if (error) {
          return reject(error)
        }

        if (!usersDBData.length) {
          return resolve(null)
        }

        const userDBData = usersDBData[0]
        const userData: IUser = {
          id : userDBData.id,
          firstName : userDBData.first_name,
          secondName : userDBData.second_name,
          email : userDBData.email,
          photoPath : userDBData.photo_path,
          password : userDBData.password,
        }

        resolve(new UserModel(userData))
      })
    })
  }

  static save (user: UserModel): Promise<UserModel> {
    return new Promise((resolve, reject) => {
      if (!user.validateField('email')) {
        return reject(new Error('Email format is so wrong'))
      }
      if (!user.validate()) {
        return reject(new Error('User validation failed'))
      }

      if (!user.id) {
        const data = {
          first_name: user.firstName,
          second_name: user.secondName,
          email: user.email,
          photo_path : user.photoPath,
          password_hash: UserModel.hashPassword(user.password),
        }
        BaseService.pool.query('insert into users set ?', data, (error: MysqlError | null, result: OkPacket) => {
          if (error) {
            return reject(error)
          }

          user.id = result.insertId
          resolve(user)
        })
      } else {
        const passwordHash = UserModel.hashPassword(user.password)
        const queryParams = [user.firstName, user.secondName, user.email, user.photoPath, passwordHash, user.id]
        BaseService.pool.query(
          'update users set first_name = ?, second_name = ?, email = ?, photo_path = ?, password_hash = ? where id = ?',
          queryParams,
          (error: MysqlError | null) => {
            if (error) {
              return reject(error)
            }
            resolve(user)
          }
        )
      }
    })
  }
}
