import dotenv from 'dotenv'
dotenv.config()
import loggerService from './common/helper/logger.service'
loggerService.setConsoleLog()
import mainService from './services/main/main.service'

console.log('Hello World');

async function exe() {
  await mainService.main()
}
exe()

