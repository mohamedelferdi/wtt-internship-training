import moment from 'moment'
import * as path from 'path'
import shellService from '../../common/helper/shellservice/shell.service'
import metisService, {
  ISearchMode,
  searchModes,
} from '../metis/application/metis.service'
import { IUser } from '../metis/domain/metis.interface'
import { ISO_DATE, MObject } from '../../common/helper/constants'
import { timeDecorator } from '../../common/timeDecorator'
import assert from 'assert'

const { NODE_ENV } = shellService.getENVmetadata()
const isProd = NODE_ENV === 'production'

class MainService {
  @timeDecorator()
  async main() {
    const { limit } = this.parseArgument()
    const file = `./inputs/sample.json`
    const data = (await shellService.readfile(file)) as MObject[]
    console.log(`There is ${data.length} elements in the ${file}`)
  }

  private parseArgument() {
    const argv = process.argv.slice(2)
    const limit = isNaN(+argv[1]) ? Infinity : +argv[1]
    assert(limit > 0)
    console.log({ NODE_ENV, limit })
    return { limit }
  }
}

export default new MainService()
