import cors from 'cors'
import express, { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import CandidateModel from './models/candidate'
import FileModel, { IFile } from './models/file'
import TemplateModel from './models/template'
import BaseService from './services/base'
import CandidatesService from './services/candidates'
import FilesService from './services/files'
import RequestService from './services/request'
import TemplatesService from './services/templates'
import UsersService from './services/users'
 
const PORT = 3016
const multer  = require('multer')
const app = express()
const storage = new WeakMap()
const fs = require('fs')
const filesPath = 'files'
const cryptoModule = require('crypto')

interface MulterRequest extends Request {
  file: {
    path: string,
    mimetype: string,
    originalname: string,
    size: number,
    fieldname: string
  }
}

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(cors())
app.use('/files', express.static(filesPath))
app.listen(PORT, async function () {
  console.log(`INTERVIEW server started on port ${PORT}`)
})


const filesStorage = multer.diskStorage({
  destination: function (request: Request, _file: File, callback: (error: null, path: string) => void) {
    let entityFolderPath = ''
    if (request.originalUrl.includes('/candidates')) {
      entityFolderPath = 'candidates'
    } else if (request.originalUrl.includes('/files')) {
      entityFolderPath = 'files'
    } else if (request.originalUrl.includes('/users')) {
      entityFolderPath = 'users'
    }
    const folderPath = `${filesPath}/${entityFolderPath}/`

    if (!fs.existsSync(folderPath)){
      fs.mkdirSync(folderPath, { recursive: true })
    }

    callback(null, folderPath)
  },
  filename: function (_request: Request, file: { originalname: string, fieldname: string }, callback: (error: null, path: string) => void) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const parts = file.originalname.split('.')
    const fileExtension = parts[1] || ''
    callback(null, `${uniqueSuffix}__${cryptoModule.randomBytes(24).toString('hex')}.${fileExtension}`)
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
  } catch (error) {
    return next(error as Error)
  }
})

app.get(
  '/config',
  checkAccess,
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const currentUser = storage.get(request)
      const candidates = await CandidatesService.getList(currentUser)
      const templates = await TemplatesService.getList(currentUser)
      const files = await FilesService.getList(currentUser)

      return response.status(200).json({ user: currentUser, candidates, templates, files })
    } catch (error) {
      return next(error as Error)
    }
  },
)

app.post(
  '/login',
  async (request: Request, response: Response) => {
    try {
      const currentUser = await UsersService.login(request.body)
      const candidates = await CandidatesService.getList(currentUser)
      const templates = await TemplatesService.getList(currentUser)
      const files = await FilesService.getList(currentUser)

      const userData = {
        id: currentUser.id,
        firstName: currentUser.firstName,
        secondName: currentUser.secondName,
        email: currentUser.email,
        photoPath: currentUser.photoPath,
      }

      response.status(200).json({
        user: userData,
        token: jwt.sign({ id: currentUser.id }, RequestService.TOKEN_KEY),
        candidates,
        templates,
        files,
      })
    } catch (error) {
      return response.status(400).send({ statusCode: 400, message: (error as Error).message })
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
        templates: [],
        user: userData,
        token: jwt.sign({ id: user.id }, RequestService.TOKEN_KEY),
      })
    } catch (error) {
      return response.status(400).send({ statusCode: 400, message: (error as Error).message })
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
      if (photoFile) {
        request.body.photoPath = photoFile.path
      }

      const user = await UsersService.update(request.body, currentUser)
      return response.send({
        id: user.id,
        firstName: user.firstName,
        secondName: user.secondName,
        email: user.email,
        photoPath: user.photoPath,
      })
    } catch (error) {
      return response.status(500).send({ statusCode: 500, message: (error as Error).message })
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
      if (photoFile) {
        request.body.photoPath = photoFile.path
      }

      const candidate = await CandidatesService.save(new CandidateModel(request.body), currentUser)
      return response.send(candidate)
    } catch (error) {
      return response.status(500).send({ statusCode: 500, message: (error as Error).message })
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
    } catch (error) {
      return response.status(500).send({ statusCode: 500, message: (error as Error).message })
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
    } catch (error) {
      return response.status(500).send({ statusCode: 500, message: (error as Error).message })
    }
  },
)

app.post(
  '/templates',
  checkAccess,
  async (request: Request, response: Response) => {
    try {
      const currentUser = storage.get(request)
      const template = await TemplatesService.save(new TemplateModel(request.body), currentUser)
      return response.send({
        id: template.id,
        title: template.title,
        data: template.data,
        isDefault: template.isDefault,
        created: template.created,
        updated: template.updated,
      })
    } catch (error) {
      return response.status(500).send({ statusCode: 500, message: (error as Error).message })
    }
  },
)

app.put(
  '/templates/:templateId',
  checkAccess,
  async (request: Request, response: Response) => {
    try {
      const currentUser = storage.get(request)
      const template = await TemplatesService.update(request.params.templateId, request.body, currentUser)
      return response.send({
        id: template.id,
        title: template.title,
        data: template.data,
        isDefault: template.isDefault,
        created: template.created,
        updated: template.updated,
      })
    } catch (error) {
      return response.status(500).send({ statusCode: 500, message: (error as Error).message })
    }
  },
)

app.delete(
  '/templates/:templateId',
  checkAccess,
  async (request: Request, response: Response) => {
    try {
      const currentUser = storage.get(request)
      await TemplatesService.remove(request.params.templateId, currentUser)
      return response.send('ok')
    } catch (error) {
      return response.status(500).send({ statusCode: 500, message: (error as Error).message })
    }
  },
)

app.post(
  '/files',
  checkAccess,
  upload.single('file'),
  async (request: Request, response: Response) => {
    try {
      const currentUser = storage.get(request)

      // File
      const multerFile = (request as MulterRequest).file
      if (!multerFile) {
        throw new Error('Binary file not send')
      }

      const fileData: IFile = {
        id: 0,
        name: request.body.name,
        originalName: Buffer.from(multerFile.originalname, 'latin1').toString('utf8'),
        mimeType: multerFile.mimetype,
        size: multerFile.size,
        path: multerFile.path,
      }

      const file = await FilesService.save(new FileModel(fileData), currentUser)
      return response.send({
        id: file.id,
        name: file.name,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        path: file.path,
      })
    } catch (error) {
      return response.status(500).send({ statusCode: 500, message: (error as Error).message })
    }
  },
)

app.put(
  '/files/:fileId',
  checkAccess,
  upload.single('file'),
  async (request: Request, response: Response) => {
    try {
      const currentUser = storage.get(request)

      // File
      const multerFile = (request as MulterRequest).file

      const fileData: IFile = { 
          id: 0,
          name: request.body.name,
          originalName: multerFile ? Buffer.from(multerFile.originalname, 'latin1').toString('utf8') : '',
          mimeType: multerFile ? multerFile.mimetype : '',
          size: multerFile ? multerFile.size : 0,
          path: multerFile ? multerFile.path : '',
       }

      const file = await FilesService.update(request.params.fileId, fileData, currentUser)
      return response.send({
        id: file.id,
        name: file.name,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        path: file.path,
      })
    } catch (error) {
      return response.status(500).send({ statusCode: 500, message: (error as Error).message })
    }
  },
)

app.delete(
  '/files/:fileId',
  checkAccess,
  async (request: Request, response: Response) => {
    try {
      const currentUser = storage.get(request)
      await FilesService.remove(request.params.fileId, currentUser)
      return response.send('ok')
    } catch (error) {
      return response.status(500).send({ statusCode: 500, message: (error as Error).message })
    }
  },
)