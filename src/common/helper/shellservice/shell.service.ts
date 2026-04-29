import fs from 'fs-extra'
import { spawn } from 'child_process'
import * as path from 'path'
import Papa from 'papaparse'
import { parseStringPromise } from 'xml2js'
import excelService, { IOptions_xlsx } from './sub/excel.service'
import { MObject } from '../constants'

export const fileFormats = ['xlsx', 'json', 'csv', 'txt'] as const
export type FileFormat = (typeof fileFormats)[number]

export const possiblesEnvs = [
  'production',
  'preprod',
  'development',
  'test',
] as const

export type ENVS = (typeof possiblesEnvs)[number]

class ShellService {
  // -------------------------------   FILES
  async createfile(
    data: any,
    FullPathFilenameDotFormat: string,
    options: IOptions_xlsx = {},
  ): Promise<void> {
    const { format, containerFolder } = this.getFilePaths(
      FullPathFilenameDotFormat,
    )
    this.createFolderIfNotExist(containerFolder)

    try {
      switch (format) {
        case 'xlsx': {
          await excelService.createfile(
            data,
            FullPathFilenameDotFormat,
            options,
          )
          break
        }

        case 'json': {
          try {
            fs.writeFileSync(
              FullPathFilenameDotFormat,
              JSON.stringify(data, null, 2) + '\n',
            )
          } catch (err) {
            console.error(
              `fail to create ${FullPathFilenameDotFormat} file` + err,
            )
          }
          break
        }

        case 'csv': {
          try {
            fs.writeFileSync(
              FullPathFilenameDotFormat,
              Papa.unparse(data, { delimiter: '\t' }),
            )
          } catch (err) {
            console.error(
              `fail to create ${FullPathFilenameDotFormat} file` + err,
            )
          }
          break
        }

        case 'txt': {
          fs.writeFileSync(FullPathFilenameDotFormat, data)
          break
        }

        default:
          throw `ShellService: format must be one of ${fileFormats} (given "${format}" in filename "${FullPathFilenameDotFormat}")`
      }
    } catch (error) {
      console.log(error)
      console.error(
        `Failed to createfile "${FullPathFilenameDotFormat}"\n` + error,
      )
    }
  }

  async readfile(FullPathFilenameDotFormat: string): Promise<any> {
    const { format } = this.getFilePaths(FullPathFilenameDotFormat)

    try {
      switch (format) {
        case 'csv': {
          const csvFile = fs.readFileSync(FullPathFilenameDotFormat)
          const csvData = csvFile.toString()
          return new Promise((resolve) => {
            Papa.parse(csvData, {
              header: true,
              skipEmptyLines: true,
              complete: (results: any) => {
                resolve(results.data)
              },
            })
          })
        }

        case 'json': {
          const text = fs.readFileSync(FullPathFilenameDotFormat)
          const json = text.toString().trim()
          const parsed = JSON.parse(json)
          return parsed
        }

        case 'xlsx': {
          const data = await excelService.readfile(FullPathFilenameDotFormat)
          return data
        }

        case 'txt': {
          const text = fs.readFileSync(FullPathFilenameDotFormat)
          const string = text.toString()
          return string
        }

        case 'xml': {
          const xml_as_string = fs.readFileSync(
            FullPathFilenameDotFormat,
            'utf8',
          )
          const xml_as_json = (await parseStringPromise(xml_as_string, {
            explicitArray: false,
          })) as MObject
          return { xml_as_json, xml_as_string }
        }

        default: {
          throw `ShellService: format must be one of ${[
            ...fileFormats,
            'xml',
          ]} (given "${format}" in filename "${format}")`
        }
      }
    } catch (error) {
      console.log(error)
      console.error(
        `Failed to readfile "${FullPathFilenameDotFormat}"\n` + error,
      )
    }
  }

  async convertFile(FullPathFilenameDotFormat: string, newFormat: FileFormat) {
    const data = await this.readfile(FullPathFilenameDotFormat)
    const { filename, containerFolder } = this.getFilePaths(
      FullPathFilenameDotFormat,
    )
    const newFile = containerFolder + filename + '.' + newFormat
    await this.createfile(data, newFile)
  }
  // ---------------------------------- OS

  ls(
    container: string,
    recursive = false,
    sortFilesByAsc?: 'nameAfirst' | 'sizeBiggerFirst' | 'timeRecentFirst',
  ) {
    container = path.resolve(container)
    const allElements = fs.readdirSync(container, {
      recursive,
      encoding: 'utf8',
    })
    const directories: string[] = []
    let files: string[] = []

    for (const element of allElements) {
      const fullPath = path.join(container, element).replace(/\\/g, '/')
      const isDirectory = fs.statSync(fullPath).isDirectory()
      if (isDirectory) {
        directories.push(fullPath)
      } else {
        files.push(fullPath)
      }
    }

    if (sortFilesByAsc === 'nameAfirst') {
      files = files.sort((a, b) => a.localeCompare(b))
    }

    if (sortFilesByAsc === 'sizeBiggerFirst') {
      files = files.sort(
        (a, b) => this.getStats(b).sizeMo - this.getStats(a).sizeMo,
      )
    }
    if (sortFilesByAsc === 'timeRecentFirst') {
      files = files.sort(
        (a, b) =>
          this.getStats(b).times[3].getTime() -
          this.getStats(a).times[3].getTime(),
      )
    }

    return { directories, files }
  }

  getStats(path: string) {
    /* 
atime: date object representing the path’s last access time.
mtime: date object representing the path’s last modification time.
ctime: date object representing the last time the path’s inode was changed.
 */

    const sample = new Date(0)
    const ret = {
      sizeMo: -1,
      birthtime: sample,
      timeLastAccess: sample,
      timeLastModification: sample,
      timeLastInodeChange: sample,
      times: [sample, sample, sample, sample],
    }

    if (path) {
      const stats = fs.statSync(path)
      const { atime, mtime, ctime, birthtime } = stats
      ret.sizeMo = Math.round(this.getSizeMo(path) * 100) / 100
      ret.birthtime = birthtime
      ret.timeLastAccess = atime
      ret.timeLastInodeChange = ctime
      ret.timeLastModification = mtime

      const times = [birthtime, atime, ctime, mtime].sort(
        (a, b) => a.getTime() - b.getTime(),
      )
      ret.times = times
    }

    return ret
  }

  getSizeMo(path: string): number {
    const isDirectory = fs.statSync(path).isDirectory()

    if (!isDirectory) {
      // is a file
      const stats = fs.statSync(path)
      const sizeMo = stats.size / (1024 * 1024)
      return sizeMo
    }

    const { files, directories } = this.ls(path)
    const arr = [...files, ...directories].map((e) => this.getSizeMo(e))
    const sum = arr.reduce((partialSum, a) => partialSum + a, 0)
    return sum
  }

  private getFilePaths(FullPathFilenameDotFormat: string) {
    const basename = path.basename(FullPathFilenameDotFormat)
    const containerFolder = FullPathFilenameDotFormat.replace(basename, '')
    // eslint-disable-next-line no-useless-escape
    const reg = /^(.+)\.([^\.]+)$/
    const filename = basename.replace(reg, '$1')
    const format = basename.replace(reg, '$2')
    return { containerFolder, filename, format }
  }

  createFolderIfNotExist(containerFolder: string) {
    if (!fs.existsSync(containerFolder)) {
      fs.mkdirSync(containerFolder, { recursive: true })
    }
  }

  run(command: string, quiet = false, cwd?: string): Promise<string> {
    console.table({ command, cwd })

    const args = ['-Command', `& { ${command} }`]
    const childProcess = spawn('powershell.exe', args, { stdio: 'pipe', cwd })

    return new Promise((resolve, reject) => {
      type T = { stdout: Uint8Array[]; stderr: Uint8Array[] }
      const chunks: T = { stdout: [], stderr: [] }

      childProcess.stdout.on('data', (chunk: Uint8Array) => {
        chunks.stdout.push(chunk)
      })

      childProcess.stderr.on('data', (chunk: Uint8Array) => {
        chunks.stderr.push(chunk)
      })

      childProcess.on('close', () => {
        const output = {
          stdout: Buffer.concat(chunks.stdout).toString('utf8').trim(),
          stderr: Buffer.concat(chunks.stderr).toString('utf8').trim(),
        }

        if (!quiet) {
          console.log(output.stdout)
        }

        if (output.stderr.length > 0) {
          return reject(output.stdout + '\n\n' + output.stderr)
        }

        resolve(output.stdout)
      })
    })
  }

  getENVmetadata() {
    const { APP_NAME, VERSION } = process.env
    const NODE_ENV = (process.env.NODE_ENV ?? 'development') as ENVS
    const key = `PORT_${NODE_ENV}`.toUpperCase()
    const port = +(process.env[key] as string)

    const apiUrl = `http://localhost:${port}`

    return {
      APP_NAME,
      NODE_ENV,
      port,
      apiUrl,
      VERSION,
    }
  }

  async testPortConnection(ip: string, port: number) {
    const command = `$Global:ProgressPreference = 'SilentlyContinue'; Test-NetConnection -ComputerName "${ip}" -Port ${port}`
    const output = await this.run(command, true)
    const pingSucceeded = /PingSucceeded.+True/.test(output)
    const tcpTestSucceeded = /TcpTestSucceeded.+True/.test(output)
    return { pingSucceeded, tcpTestSucceeded }
  }

  addSlashIfNotExist(str: string) {
    const last = str.charAt(str.length - 1)
    const shouldAddSlash = last !== '/' && last !== '\\'
    return str + (shouldAddSlash ? '/' : '')
  }

  crash() {
    if (Math.random() < 10) {
      throw `ShellService has crash perpusly`
    }
  }

  errorToString(error: any): string {
    try {
      const { name, message, stack } = error
      const tab = [name, message, stack]
      if (tab.every((e) => e == null)) {
        throw ''
      }
      return tab.join(' ')
    } catch (ignore: any) {
      // cannot distruct error
      return '' + error
    }
  }

  objectToString(mobject: MObject, returnArray = false) {
    // force to primitive object format
    // mobject = JSON.parse(JSON.stringify(mobject))

    const arr = Object.entries(mobject).map(([k, v]) => {
      let value = '\t' + v

      if (typeof v == 'object') {
        value = '\n' + JSON.stringify(v, null, 2)

        if (Array.isArray(v)) {
          value = '\n' + v.map((e) => '' + e).join('\n\n')
        }
      }
      return [`++ ${k}:`, value]
    })

    return returnArray === true ? arr : arr.map((e) => e.join(' ')).join('\n')
  }
}

export default new ShellService()
