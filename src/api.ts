import cors from 'cors'
import express, { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import BaseService from './services/base'
import CandidatesService from './services/candidates'
import RequestService from './services/request'
import UsersService from './services/users'
 
const PORT = 3016
const multer  = require('multer')
const app = express()
const path = require('path')
const storage = new WeakMap()
const fs = require('fs')
const filesPath = 'files'

interface MulterRequest extends Request { file: { path: string } }

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use('/files', express.static(filesPath))
app.use(cors())
app.listen(PORT, async function () {
  console.log(`STARTED on port ${PORT}`)
})


const filesStorage = multer.diskStorage({
  destination: function (request: Request, _file: File, callback: (error: null, path: string) => void) {
    const entityFolderPath = request.originalUrl.includes('/candidates') ? 'candidates' : 'users'
    const folderPath = `${filesPath}/${entityFolderPath}/`

    if (!fs.existsSync(folderPath)){
      fs.mkdirSync(folderPath, { recursive: true })
    }

    callback(null, folderPath)
  },
  filename: function (_request: Request, file: { originalname: string }, callback: (error: null, path: string) => void) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const extension = path.extname(file.originalname)
    callback(null, `${uniqueSuffix}${extension}`)
  }
})
const upload = multer({ storage: filesStorage })

BaseService.init()

function checkAccess(request: Request, response: Response, next: NextFunction) {
  if (storage.get(request)) {
    return next()
  }

  return response.status(401).send({ message: 'Not Authorized' })
}

app.use(async (request: Request, _response: Response, next: NextFunction) => {
  try {
    const currentUser = await RequestService.getUserFromRequest(request)

    if (!currentUser) return next()

    storage.set(
      request, 
      {
        id: currentUser.id,
        firstName: currentUser.firstName,
        secondName: currentUser.secondName,
        email: currentUser.email,
        photoPath: currentUser.photoPath,
      }
    )

    next()
  } catch (error: any) {
    return next(error)
  }
})

app.get(
  '/config',
  checkAccess,
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const currentUser = storage.get(request)
      const candidates = await CandidatesService.getList(currentUser )

      return response.status(200).json({ candidates, user: currentUser  })
    } catch (error: any) {
      return next(error)
    }
  },
)

app.post(
  '/login',
  async (request: Request, response: Response) => {
    try {
      const currentUser = await UsersService.login(request.body)
      const candidates = await CandidatesService.getList(currentUser)

      const userData = {
        id: currentUser.id,
        firstName: currentUser.firstName,
        secondName: currentUser.secondName,
        email: currentUser.email,
        photoPath: currentUser.photoPath,
      }

      response.status(200).json({
        candidates,
        user: userData,
        token: jwt.sign({ id: currentUser.id }, RequestService.TOKEN_KEY),
      })
    } catch (error: any) {
      return response.status(400).send({ statusCode: 400, message: error.message })
    }
  },
)

app.post(
  '/users',
  upload.single('photo'),
  async (request: Request, response: Response) => {
    try {
      // Photo
      const photoFile = (request as MulterRequest).file
      request.body.photoPath = photoFile ? photoFile.path : ''

      const user = await UsersService.create(request.body)
      const candidates = await CandidatesService.getList(user)

      const userData = {
        id: user.id,
        firstName: user.firstName,
        secondName: user.secondName,
        email: user.email,
        photoPath: user.photoPath,
      }

      response.status(200).json({
        candidates,
        user: userData,
        token: jwt.sign({ id: user.id }, RequestService.TOKEN_KEY),
      })
    } catch (error: any) {
      return response.status(400).send({ statusCode: 400, message: error.message })
    }
  },
)

app.put(
  '/users',
  checkAccess,
  upload.single('photo'),
  async (request: Request, response: Response) => {
    try {
      const currentUser = storage.get(request)

      // Photo
      const photoFile = (request as MulterRequest).file
      request.body.photoPath = photoFile ? photoFile.path : ''

      const user = await UsersService.update(request.body, currentUser)
      return response.send({
        id: user.id,
        firstName: user.firstName,
        secondName: user.secondName,
        email: user.email,
        photoPath: user.photoPath,
      })
    } catch (error: any) {
      return response.status(500).send({ statusCode: 500, message: error.message })
    }
  },
)

app.post(
  '/candidates',
  checkAccess,
  upload.single('photo'),
  async (request: Request, response: Response) => {
    try {
      const currentUser = storage.get(request)

      // Photo
      const photoFile = (request as MulterRequest).file
      request.body.photoPath = photoFile ? photoFile.path : ''

      const candidate = await CandidatesService.create(request.body, currentUser)
      return response.send(candidate)
    } catch (error: any) {
      return response.status(500).send({ statusCode: 500, message: error.message })
    }
  },
)

app.put(
  '/candidates/:candidateId',
  checkAccess,
  upload.single('photo'),
  async (request: Request, response: Response) => {
    try {
      const currentUser = storage.get(request)

      // Photo
      const photoFile = (request as MulterRequest).file
      request.body.photoPath = photoFile ? photoFile.path : ''

      const candidate = await CandidatesService.update(request.params.candidateId, request.body, currentUser)
      return response.send(candidate)
    } catch (error: any) {
      return response.status(500).send({ statusCode: 500, message: error.message })
    }
  },
)

app.delete(
  '/candidates/:candidateId',
  checkAccess,
  async (request: Request, response: Response) => {
    try {
      const currentUser = storage.get(request)
      const { candidateId } = request.params
      await CandidatesService.remove(candidateId, currentUser)
      return response.send('ok')
    } catch (error: any) {
      return response.status(500).send({ statusCode: 500, message: error.message })
    }
  },
)
