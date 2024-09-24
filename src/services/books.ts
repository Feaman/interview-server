import { MysqlError, OkPacket } from 'mysql'
import BookModel, { IBook, IBookDB } from '~/models/book'
import BaseService from '~/services/base'

export default class BooksService extends BaseService {
  static async getList (): Promise<BookModel[]> {
    return new Promise((resolve, reject) => {
      const books: BookModel[] = []
      const sql = 'select books.*, authors.id author_id, authors.name author_name from books inner join authors on books.author_id = authors.id where books.deleted = 0 order by books.id ASC'

      this.pool.query(
        { sql },
        async (error: any, booksData: IBookDB[]) => {
          if (error) {
            return reject({ message: error.message })
          }

          booksData.forEach(async (bookData: IBookDB) => {
            const book = new BookModel(bookData) 
            book.author = { id: bookData.author_id, name: bookData.author_name }
            books.push(book)
          })

          resolve(books)
        }
      )
    })
  }

  static async create (bookData: IBook): Promise<BookModel> {
    const existentBook = await this.findById(String(bookData.id))
    if (existentBook) {
      throw new Error('Book with such an id is already exists')
    }

    const book = new BookModel(bookData)

    return BooksService.save(book)
  }

  static async update (bookId: string, data: IBook): Promise<BookModel> {
    const book = await this.findById(bookId)
    if (!book) {
      throw new Error('Book not found')
    }

    if (data.title) {
      book.title = data.title
    }
    if (data.assessment) {
      book.assessment = data.assessment
    }
    if (data.audio) {
      book.audio= data.audio
    }
    if (data.author_id) {
      book.author_id= data.author_id
    }
    if (data.binder) {
      book.binder= data.binder
    }
    if (data.communicator) {
      book.communicator= data.communicator
    }
    if (data.phone) {
      book.phone= data.phone
    }
    if (data.author_id) {
      book.author_id= data.author_id
    }

    return BooksService.save(book)
  }

  static async remove (bookId: string): Promise<BookModel> {
    const book = await this.findById(bookId)
    if (!book) {
      throw new Error('book not found')
    }

    return new Promise((resolve, reject) => {
      BaseService.pool.query(
        'update books set deleted = 1 where id = ?',
        [book.id],
        (error: MysqlError | null) => {
          if (error) {
            return reject(error)
          }
          resolve(book)
        }
      )
    })
  }

  static findById (id: string): Promise<BookModel | null> {
    return this.findByField('id', id)
  }

  static async findByField (fieldName: string, fieldValue: string): Promise<BookModel | null> {
    return new Promise((resolve, reject) => {
      this.pool.query({
        sql: `select * from books where ${fieldName} = ?`,
        values: [fieldValue],
      },
      (error: MysqlError, booksDBData: IBookDB[]) => {
        if (error) {
          return reject(error)
        }

        if (!booksDBData.length) {
          return resolve(null)
        }

        const bookDBData = booksDBData[0]
        const bookData: IBook = {
          id : bookDBData.id,
          title : bookDBData.title,
          assessment : bookDBData.assessment,
          audio: bookDBData.audio,
          binder: bookDBData.binder,
          communicator: bookDBData.communicator,
          phone: bookDBData.phone,
          author_id: bookDBData.author_id,
          created: bookDBData.created,
        }

        resolve(new BookModel(bookData))
      })
    })
  }

  static save (book: BookModel): Promise<BookModel> {
    return new Promise((resolve, reject) => {
      if (!book.validate()) {
        return reject(new Error('book validation failed'))
      }

      if (!book.id) {
        const data = {
          title : book.title,
          assessment : book.assessment,
          audio: book.audio,
          binder: book.binder,
          communicator: book.communicator,
          phone: book.phone,
          author_id: book.author_id,
        }
        BaseService.pool.query('insert into books set ?', data, (error: MysqlError | null, result: OkPacket) => {
          if (error) {
            return reject(error)
          }

          book.id = result.insertId
          resolve(book)
        })
      } else {
        const queryParams = [
          book.title,
          book.assessment,
          book.audio,
          book.binder,
          book.communicator,
          book.phone,
          book.author_id,
          book.id,
        ]
        BaseService.pool.query(
          'update books set title = ?, assessment = ?, audio = ?, binder = ?, communicator = ?, phone = ?, author_id = ? where id = ?',
          queryParams,
          (error: MysqlError | null) => {
            if (error) {
              return reject(error)
            }
            resolve(book)
          }
        )
      }
    })
  }
}
