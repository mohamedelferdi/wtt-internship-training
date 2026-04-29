import { MObject } from '../../../common/helper/constants'

export interface IUser extends MObject {
  utcode: string
  first_name: string
  last_name: string
  phone: string
  mail: string
}
