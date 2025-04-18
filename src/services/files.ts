import { MysqlError, OkPacket } from 'mysql'
import FileModel, { IFile, IFileDB } from '~/models/file'
import UserModel from '~/models/user'
import BaseService from '~/services/base'

export default class FilesService extends BaseService {
  static async getList (user: UserModel): Promise<FileModel[]> {
    return new Promise((resolve, reject) => {
      const files: FileModel[] = []

      this.pool.query(
        {
          sql: 'select * from files where user_id = ? order by created desc',
          values: [user.id],
        },
        (error: Error, filesData: IFileDB[]) => {
          if (error) {
            return reject({ message: (error as Error).message })
          }

          filesData.forEach((fileDBData: IFileDB) => {
            const fileData: IFile = {
              id: fileDBData.id,
              name: fileDBData.name,
              mimeType: fileDBData.mime_type,
              size: fileDBData.size,
              path: fileDBData.path,
            }
            files.push(fileData as FileModel)
          })
          
          resolve(files)
        }
      )
    })
  }

  static async create (fileData: IFile, user: UserModel): Promise<FileModel> {
    return FilesService.save(new FileModel(fileData), user)
  }

  static async update (fileId: string, data: IFile, user: UserModel): Promise<FileModel> {
    const file = await this.findById(fileId, user)
    if (!file) {
      throw new Error('File not found')
    }

    file.name = data.name
    file.mimeType = data.mimeType
    file.size = data.size
    file.path = data.path

    return this.save(file, user)
  }

  static findById (id: string, user: UserModel): Promise<FileModel | null> {
    return this.findByField('id', id, user)
  }


  static async findByField (fieldName: string, fieldValue: string, user: UserModel): Promise<FileModel | null> {
    return new Promise((resolve, reject) => {
      this.pool.query({
        sql: `select * from files where ${fieldName} = ? and user_id = ?`,
        values: [fieldValue, user.id],
      },
      (error: MysqlError, candidatesDBData: IFileDB[]) => {
        if (error) {
          return reject(error)
        }

        if (!candidatesDBData.length) {
          return resolve(null)
        }

        const fileDBData = candidatesDBData[0]
        const candidateData: IFile = {
          id : fileDBData.id,
          name: fileDBData.name,
          mimeType: fileDBData.mime_type,
          size: fileDBData.size,
          path: fileDBData.path,
        }

        resolve(new FileModel(candidateData))
      })
    })
  }

  static clearDefault (user: UserModel): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const queryParams = [user.id]
      BaseService.pool.query(
        'update files set is_default = 0 where user_id = ?',
        queryParams,
        (error: MysqlError | null) => {
          if (error) {
            return reject(error)
          }
          resolve(true)
        }
      )
    })
  }

  static save (file: FileModel, user: UserModel): Promise<FileModel> {
    return new Promise((resolve, reject) => {
      if (!file.validate()) {
        return reject(new Error('File validation failed'))
      }

      if (!file.id) {
        const data = {
          name: file.name,
          mimeType: file.mimeType,
          size: file.size,
          path: file.path,
          user_id: user.id,
        }
        BaseService.pool.query('insert into files set ?', data, (error: MysqlError | null, result: OkPacket) => {
          if (error) {
            return reject(error)
          }

          file.id = result.insertId
          resolve(file)
        })
      } else {
        const queryParams = [file.name, file.size, file.mimeType, file.path, file.id]
        BaseService.pool.query(
          'update files set name = ?, size = ?, mime_type = ?, path = ? where id = ?',
          queryParams,
          (error: MysqlError | null) => {
            if (error) {
              return reject(error)
            }
            resolve(file)
          }
        )
      }
    })
  }

  static async remove (fileId: string, user: UserModel): Promise<FileModel> {
    const file = await this.findById(fileId, user)
    if (!file) {
      throw new Error('File not found')
    }

    return new Promise((resolve, reject) => {
      BaseService.pool.query(
        'delete from files where id = ?',
        [file.id],
        (error: MysqlError | null) => {
          if (error) {
            return reject(error)
          }
          resolve(file)
        }
      )
    })
  }
}
