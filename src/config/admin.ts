import * as admin from 'firebase-admin'
import * as path from 'path'
import * as fs from 'fs'

const secretFilePath = path.join(__dirname, '..', 'serviceAccountKey.json')
const fileContent = fs.readFileSync(secretFilePath).toString()
const serviceAccount = JSON.parse(fileContent)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

export default admin
