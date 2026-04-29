import dotenv from 'dotenv'
dotenv.config()
import loggerService from './common/helper/logger.service'
loggerService.setConsoleLog()
import mainService from './services/main/main.service'
import shellService from './common/helper/shellservice/shell.service'
import { IUser } from './services/metis/domain/metis.interface'
import axios from 'axios'

async function exe() {
  return 5
}
exe()
