import { MysqlError, OkPacket } from 'mysql'
import AuthorModel, { IAuthor, IAuthorDB } from '~/models/author'
import BaseService from '~/services/base'

export default class AuthorsService extends BaseService {
  static async getList (): Promise<AuthorModel[]> {
    return new Promise((resolve, reject) => {
      const notes: AuthorModel[] = []
      const sql = 'select * from authors where deleted = 0 order by id ASC'

      this.pool.query(
        { sql },
        (error: any, authorsData: IAuthor[]) => {
          if (error) {
            return reject({ message: error.message })
          }

          authorsData.forEach(async (noteData: IAuthor) => {
            notes.push(new AuthorModel(noteData))
          })
          
          resolve(notes)
        }
      )
    })
  }

  static async create (authorData: IAuthor): Promise<AuthorModel> {
    const existentAuthor = await this.findById(String(authorData.id))
    if (existentAuthor) {
      throw new Error('Author with such an id is already exists')
    }

    const author = new AuthorModel(authorData)
    return AuthorsService.save(author)
  }

  static async update (authorId: string, data: IAuthor): Promise<AuthorModel> {
    const author = await this.findById(authorId)
    if (!author) {
      throw new Error('Author not found')
    }

    author.name = data.name

    return AuthorsService.save(author)
  }

  static async remove (authorId: string): Promise<AuthorModel> {
    const author = await this.findById(authorId)
    if (!author) {
      throw new Error('author not found')
    }

    return new Promise((resolve, reject) => {
      BaseService.pool.query(
        'update authors set deleted = 1 where id = ?',
        [author.id],
        (error: MysqlError | null) => {
          if (error) {
            return reject(error)
          }
          resolve(author)
        }
      )
    })
  }

  static findById (id: string): Promise<AuthorModel | null> {
    return this.findByField('id', id)
  }

  static async findByField (fieldName: string, fieldValue: string): Promise<AuthorModel | null> {
    return new Promise((resolve, reject) => {
      this.pool.query({
        sql: `select * from authors where ${fieldName} = ? and deleted = 0`,
        values: [fieldValue],
      },
      (error: MysqlError, authorsDBData: IAuthorDB[]) => {
        if (error) {
          return reject(error)
        }

        if (!authorsDBData.length) {
          return resolve(null)
        }

        const authorDBData = authorsDBData[0]
        const authorData: IAuthor = {
          id : authorDBData.id,
          name : authorDBData.name,
        }

        resolve(new AuthorModel(authorData))
      })
    })
  }

  static save (author: AuthorModel): Promise<AuthorModel> {
    return new Promise((resolve, reject) => {
      if (!author.validate()) {
        return reject(new Error('author validation failed'))
      }

      if (!author.id) {
        const data = {
          name : author.name,
        }
        BaseService.pool.query('insert into authors set ?', data, (error: MysqlError | null, result: OkPacket) => {
          if (error) {
            return reject(error)
          }

          author.id = result.insertId
          resolve(author)
        })
      } else {
        const queryParams = [
          author.name,
          author.id,
        ]
        BaseService.pool.query(
          'update authors set name = ? where id = ?',
          queryParams,
          (error: MysqlError | null) => {
            if (error) {
              return reject(error)
            }
            resolve(author)
          }
        )
      }
    })
  }
}
