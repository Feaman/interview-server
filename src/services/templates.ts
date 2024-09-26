import { MysqlError, OkPacket } from 'mysql'
import TemplateModel, { ITemplate, ITemplateDB } from '~/models/template'
import UserModel from '~/models/user'
import BaseService from '~/services/base'

export default class TemplatesService extends BaseService {
  static async getList (user: UserModel): Promise<TemplateModel[]> {
    return new Promise((resolve, reject) => {
      const templates: TemplateModel[] = []

      this.pool.query(
        {
          sql: 'select * from templates where user_id = ? order by created desc',
          values: [user.id],
        },
        (error: any, templatesData: ITemplateDB[]) => {
          if (error) {
            return reject({ message: error.message })
          }

          templatesData.forEach((candidateDBData: ITemplateDB) => {
            const templateData: ITemplate = {
              id : candidateDBData.id,
              data : candidateDBData.data,
            }
            templates.push(new TemplateModel(templateData))
          })
          
          resolve(templates)
        }
      )
    })
  }

  static async create (templateData: ITemplate, user: UserModel): Promise<TemplateModel> {
    return TemplatesService.save(new TemplateModel(templateData), user)
  }

  static async update (candidateId: string, data: ITemplate, user: UserModel): Promise<TemplateModel> {
    const template = await this.findById(candidateId, user)
    if (!template) {
      throw new Error('Template not found')
    }

    template.data = data.data

    return this.save(template, user)
  }

  static findById (id: string, user: UserModel): Promise<TemplateModel | null> {
    return this.findByField('id', id, user)
  }


  static async findByField (fieldName: string, fieldValue: string, user: UserModel): Promise<TemplateModel | null> {
    return new Promise((resolve, reject) => {
      this.pool.query({
        sql: `select * from templates where ${fieldName} = ? and user_id = ?`,
        values: [fieldValue, user.id],
      },
      (error: MysqlError, candidatesDBData: ITemplateDB[]) => {
        if (error) {
          return reject(error)
        }

        if (!candidatesDBData.length) {
          return resolve(null)
        }

        const candidateDBData = candidatesDBData[0]
        const candidateData: ITemplate = {
          id : candidateDBData.id,
          data : candidateDBData.data,
        }

        resolve(new TemplateModel(candidateData))
      })
    })
  }

  static save (template: TemplateModel, user: UserModel): Promise<TemplateModel> {
    return new Promise((resolve, reject) => {
      if (!template.validate()) {
        return reject(new Error('Template validation failed'))
      }

      if (!template.id) {
        const data = {
          data: template.data,
          user_id: user.id,
        }
        BaseService.pool.query('insert into templates set ?', data, (error: MysqlError | null, result: OkPacket) => {
          if (error) {
            return reject(error)
          }

          template.id = result.insertId
          resolve(template)
        })
      } else {
        const queryParams = [template.data, template.userId, template.id]
        BaseService.pool.query(
          'update templates set data = ?, user_id = ? where id = ?',
          queryParams,
          (error: MysqlError | null) => {
            if (error) {
              return reject(error)
            }
            resolve(template)
          }
        )
      }
    })
  }

  static async remove (templateId: string, user: UserModel): Promise<TemplateModel> {
    const template = await this.findById(templateId, user)
    if (!template) {
      throw new Error('Template not found')
    }

    return new Promise((resolve, reject) => {
      BaseService.pool.query(
        'delete from templates where id = ?',
        [template.id],
        (error: MysqlError | null) => {
          if (error) {
            return reject(error)
          }
          resolve(template)
        }
      )
    })
  }
}
