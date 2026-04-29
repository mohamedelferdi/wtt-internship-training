import _ from 'lodash'
import { MObject } from '../../common/helper/constants'

export type ITransformFun = (brut: MObject) => MObject | null

class TransformerService {
  // tools
  /**
   * Returns true if element is defined (not null and length > 0)
   */
  isDefined(value: string | undefined | null) {
    return value != null && ('' + value).trim().length > 0
  }

  isMatch = (a: string, b: string) => {
    return (
      this.isDefined(a) &&
      this.isDefined(b) &&
      a.toLowerCase() === b.toLowerCase()
    )
  }

  isMatchString = (
    bigString: string,
    subString: string,
    exactMatch = false,
  ) => {
    if (!this.isDefined(bigString) || !this.isDefined(subString)) {
      return false
    }

    const aux = (value: string) =>
      value.trim().replace(/\s+/g, ' ').toLowerCase()

    bigString = aux(bigString)
    subString = aux(subString)

    return exactMatch ? bigString === subString : bigString.includes(subString)
  }

  isMatchNumber = (a: string, b: string) => {
    return (
      this.isDefined(a) &&
      this.isDefined(b) &&
      this.getNeatNumber(a) === this.getNeatNumber(b)
    )
  }

  getNeatNumber = (str: string) => {
    const ret = ('' + str).trim().replace(/\D/g, '').slice(-9)
    return ret
  }

  isPhoneNumber = (a: string) => {
    return /^\+?\d+$/.test(a)
  }

  getAttributeValuesFromProfiles = (
    data: MObject[],
    attribute: string,
  ): string[] => {
    const ret = data.map((e) => e[attribute]).filter((e) => this.isDefined(e))
    return ret
  }

  toISOString(strDate: string) {
    return new Date(strDate).toISOString()
  }
}

export default new TransformerService()
