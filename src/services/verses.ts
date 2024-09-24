import { MysqlError, OkPacket } from 'mysql'
import VerseModel, { IVerse, IVerseDB } from '~/models/verse'
import BaseService from '~/services/base'

export default class VersesService extends BaseService {
  static async getList (): Promise<VerseModel[]> {
    return new Promise((resolve, reject) => {
      const notes: VerseModel[] = []
      const sql = 'select * from verses where verses.deleted = 0 order by id ASC'

      this.pool.query(
        { sql },
        (error: any, versesData: IVerse[]) => {
          if (error) {
            return reject({ message: error.message })
          }

          versesData.forEach(async (noteData: IVerse) => {
            notes.push(new VerseModel(noteData))
          })
          
          resolve(notes)
        }
      )
    })
  }

  static async create (verseData: IVerse): Promise<VerseModel> {
    const existentVerse = await this.findById(String(verseData.id))
    if (existentVerse) {
      throw new Error('Verse with such an id is already exists')
    }

    const verse = new VerseModel(verseData)
    return VersesService.save(verse)
  }

  static async update (verseId: string, data: IVerse): Promise<VerseModel> {
    const verse = await this.findById(verseId)
    if (!verse) {
      throw new Error('Verse not found')
    }

    if (data.title) {
      verse.title = data.title
    }
    if (data.text) {
      verse.text = data.text
    }

    return VersesService.save(verse)
  }

  static async remove (verseId: string): Promise<VerseModel> {
    const verse = await this.findById(verseId)
    if (!verse) {
      throw new Error('verse not found')
    }

    return new Promise((resolve, reject) => {
      BaseService.pool.query(
        'update verses set deleted = 1 where id = ?',
        [verse.id],
        (error: MysqlError | null) => {
          if (error) {
            return reject(error)
          }
          resolve(verse)
        }
      )
    })
  }

  static findById (id: string): Promise<VerseModel | null> {
    return this.findByField('id', id)
  }

  static async findByField (fieldName: string, fieldValue: string): Promise<VerseModel | null> {
    return new Promise((resolve, reject) => {
      this.pool.query({
        sql: `select * from verses where ${fieldName} = ?`,
        values: [fieldValue],
      },
      (error: MysqlError, versesDBData: IVerseDB[]) => {
        if (error) {
          return reject(error)
        }

        if (!versesDBData.length) {
          return resolve(null)
        }

        const verseDBData = versesDBData[0]
        const verseData: IVerse = {
          id : verseDBData.id,
          title : verseDBData.title,
          text : verseDBData.text,
          created: verseDBData.created,
        }

        resolve(new VerseModel(verseData))
      })
    })
  }

  static save (verse: VerseModel): Promise<VerseModel> {
    return new Promise((resolve, reject) => {
      if (!verse.validate()) {
        return reject(new Error('verse validation failed'))
      }

      if (!verse.id) {
        const data = {
          title : verse.title,
          text : verse.text,
        }
        BaseService.pool.query('insert into verses set ?', data, (error: MysqlError | null, result: OkPacket) => {
          if (error) {
            return reject(error)
          }

          verse.id = result.insertId
          resolve(verse)
        })
      } else {
        const queryParams = [
          verse.title,
          verse.text,
          verse.id,
        ]
        BaseService.pool.query(
          'update verses set title = ?, text = ? where id = ?',
          queryParams,
          (error: MysqlError | null) => {
            if (error) {
              return reject(error)
            }
            resolve(verse)
          }
        )
      }
    })
  }
}
