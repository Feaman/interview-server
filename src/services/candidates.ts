import { MysqlError, OkPacket } from 'mysql'
import CandidateModel, { ICandidate, ICandidateDB } from '~/models/candidate'
import UserModel from '~/models/user'
import BaseService from '~/services/base'

const fs = require('fs')

export default class CandidatesService extends BaseService {
  static async getList (user: UserModel): Promise<CandidateModel[]> {
    return new Promise((resolve, reject) => {
      const candidates: CandidateModel[] = []

      this.pool.query(
        {
          sql: 'select * from candidates where user_id = ? order by created desc',
          values: [user.id],
        },
        (error: Error, candidatesData: ICandidateDB[]) => {
          if (error) {
            return reject({ message: (error as Error).message })
          }

          candidatesData.forEach((candidateDBData: ICandidateDB) => {
            const candidateData: ICandidate = {
              id : candidateDBData.id,
              firstName : candidateDBData.first_name,
              secondName : candidateDBData.second_name,
              photoPath : candidateDBData.photo_path,
              data : candidateDBData.data,
              created : candidateDBData.created,
            }
            candidates.push(new CandidateModel(candidateData))
          })
          
          resolve(candidates)
        }
      )
    })
  }

  static async create (candidateData: ICandidate, user: UserModel): Promise<CandidateModel> {
    const candidate = new CandidateModel(candidateData)
    return CandidatesService.save(candidate, user)
  }

  static async update (candidateId: string, data: ICandidate, user: UserModel): Promise<CandidateModel> {
    const candidate = await this.findById(candidateId, user)
    if (!candidate) {
      throw new Error('Candidate not found')
    }

    try {
      if (data.photoPath && candidate.photoPath) {
        fs.unlinkSync(__dirname + '/' + candidate.photoPath)
      }
    } catch (error) {
      console.error(error)
    }

    candidate.firstName = data.firstName
    candidate.secondName = data.secondName
    candidate.data = data.data
    if (data.photoPath) {
      candidate.photoPath = data.photoPath 
    }

    return this.save(candidate, user)
  }

  static async remove (candidateId: string, user: UserModel): Promise<CandidateModel> {
    const candidate = await this.findById(candidateId, user)
    if (!candidate) {
      throw new Error('Candidate not found')
    }

    try {
      if (candidate.photoPath) {
        fs.unlinkSync(__dirname + '/' + candidate.photoPath)
      }
    } catch (error) {
      console.error(error)
    }

    return new Promise((resolve, reject) => {
      BaseService.pool.query(
        'delete from candidates where id = ?',
        [candidate.id],
        (error: MysqlError | null) => {
          if (error) {
            return reject(error)
          }
          resolve(candidate)
        }
      )
    })
  }

  static findById (id: string, user: UserModel): Promise<CandidateModel | null> {
    return this.findByField('id', id, user)
  }

  static async findByField (fieldName: string, fieldValue: string, user: UserModel): Promise<CandidateModel | null> {
    return new Promise((resolve, reject) => {
      this.pool.query({
        sql: `select * from candidates where ${fieldName} = ? and user_id = ?`,
        values: [fieldValue, user.id],
      },
      (error: MysqlError, candidatesDBData: ICandidateDB[]) => {
        if (error) {
          return reject(error)
        }

        if (!candidatesDBData.length) {
          return resolve(null)
        }

        const candidateDBData = candidatesDBData[0]
        const candidateData: ICandidate = {
          id : candidateDBData.id,
          firstName : candidateDBData.first_name,
          secondName : candidateDBData.second_name,
          photoPath : candidateDBData.photo_path,
          data : candidateDBData.data,
          created : candidateDBData.created,
        }

        resolve(new CandidateModel(candidateData))
      })
    })
  }

  static save (candidate: CandidateModel, user: UserModel): Promise<CandidateModel> {
    const queryPromise: Promise<CandidateModel> = new Promise((resolve, reject) => {
      if (!candidate.validate()) {
        return reject(new Error('Candidate validation failed'))
      }

      if (!candidate.id) {
        const data = {
          first_name: candidate.firstName,
          second_name: candidate.secondName,
          photo_path: candidate.photoPath,
          data: candidate.data,
          user_id: user.id,
        }
        BaseService.pool.query('insert into candidates set ?', data, (error: MysqlError | null, result: OkPacket) => {
          if (error) {
            return reject(error)
          }

          candidate.id = result.insertId
          resolve(candidate)
        })
      } else {
        const queryParams = [candidate.firstName, candidate.secondName, candidate.data, candidate.photoPath, candidate.id]
        BaseService.pool.query(
          'update candidates set first_name = ?, second_name = ?, data = ?, photo_path = ? where id = ?',
          queryParams,
          (error: MysqlError | null) => {
            if (error) {
              return reject(error)
            }
            resolve(candidate)
          }
        )
      }
    })

    return queryPromise
      .then((candidate: CandidateModel): Promise<ICandidate | null> => {
        return this.findById(String(candidate.id), user)
      })
      .then((candidateData: ICandidate | null) => {
        if (!candidateData) {
          throw new Error('Candidate not found')
        }
        return new CandidateModel(candidateData)
      })
  }
}
