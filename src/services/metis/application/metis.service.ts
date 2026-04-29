import { mean } from 'lodash'
import ts from '../../utils/transfomer.service'
import { IUser } from '../domain/metis.interface'
import Fuse from 'fuse.js'

const NAME_THERSHOLD = 85
const UTCODE_THRESHOLD = 100

export const searchModes = ['QUICK_SEARCH', 'DEFAULT', 'DEEP_SEARCH'] as const
export type ISearchMode = (typeof searchModes)[number]

/*
See Help method below to understand this class
*/
class MetisService {
  userDoesMatchCriterias(
    toBeSearch: Partial<IUser>,
    toBeReturn: IUser,
    options: { mode: ISearchMode },
  ) {
    const mode = options?.mode

    if (mode === 'QUICK_SEARCH') {
      return this.userDoesMatchCriteriasSimple(toBeSearch, toBeReturn)
    }
    return this.userDoesMatchCriteriasDeep(
      toBeSearch,
      toBeReturn,
      mode === 'DEEP_SEARCH',
    )
  }

  private userDoesMatchCriteriasSimple(
    toBeSearch: Partial<IUser>,
    toBeReturn: IUser,
  ) {
    const keys = ['utcode', 'mail']

    ts.isMatchString
    return keys.some((k) => ts.isMatch(toBeReturn[k], toBeSearch[k]))
      ? toBeReturn
      : undefined
  }

  private userDoesMatchCriteriasDeep(
    toBeSearch: Partial<IUser>,
    toBeReturn: IUser,
    pKeysMustMatchIfProvided: boolean,
  ): IUser | undefined {
    const scores: {
      key: string
      score100: number
      pattern: string
      searchedIn: string
    }[] = []

    // utcode
    {
      const key = `utcode`
      const pattern = ('' + (toBeSearch[key] ?? '')).trim().toLowerCase()
      const cond =
        ts.isDefined(pattern) && pattern.length >= 4 && pattern.startsWith('u')
      const searchedIn = ('' + (toBeReturn[key] ?? '')).trim().toLowerCase()

      if (cond) {
        if (pKeysMustMatchIfProvided === true && ts.isDefined(searchedIn)) {
          return searchedIn === pattern
            ? { ...toBeReturn, matching: { score: 100, scores } }
            : undefined
        }
        const score100 = this.fuseSearch(pattern, searchedIn)
        scores.push({ key, score100, pattern, searchedIn })
      }
    }

    {
      const key = 'mail'
      const pattern = toBeSearch[key]
      const cond =
        ts.isDefined(pattern) && pattern != null && pattern.length >= 7
      const searchedIn = toBeReturn[key]
      if (cond) {
        if (pKeysMustMatchIfProvided === true && ts.isDefined(searchedIn)) {
          return searchedIn === pattern
            ? { ...toBeReturn, matching: { score: 100, scores } }
            : undefined
        }
        const score100 = this.fuseSearch(pattern, searchedIn)
        scores.push({ key, score100, pattern, searchedIn })
      }
    }

    {
      const pattern = toBeSearch.first_name + ' ' + toBeSearch.last_name
      const pattern2 = toBeSearch.last_name + ' ' + toBeSearch.first_name

      const cond =
        ts.isDefined(toBeSearch.first_name) &&
        ts.isDefined(toBeSearch.last_name) &&
        pattern.length >= 7

      const searchedIn = toBeReturn.first_name + ' ' + toBeReturn.last_name
      if (cond) {
        const score100_pattern1 = this.fuseSearch(pattern, searchedIn)
        const score100_pattern2 = this.fuseSearch(pattern2, searchedIn)

        scores.push({
          key: 'first_name last_name',
          score100: Math.max(score100_pattern1, score100_pattern2),
          pattern,
          searchedIn,
        })
      }
    }

    {
      const key = 'phone'
      const pattern = ts.getNeatNumber(toBeSearch[key] ?? '')
      const cond = ts.isDefined(pattern) && pattern.length > 6
      const searchedIn = ts.getNeatNumber(toBeReturn[key])
      if (cond) {
        const score100 = this.fuseSearch(pattern, searchedIn)
        scores.push({ key, score100, pattern, searchedIn })
      }
    }

    function checkMatch(keys: string[], seuil: number): boolean[] {
      return keys.flatMap((key) => {
        const element = scores.find((e) => e.key === key)
        if (element != null) {
          return element.score100 >= seuil
        }
        return []
      })
    }

    const bools: boolean[] = [
      ...checkMatch(['utcode', 'phone', 'mail'], UTCODE_THRESHOLD),
      ...checkMatch(['first_name last_name'], NAME_THERSHOLD),
    ]
    const isAMatch = bools.some((e) => e === true)

    if (isAMatch === true) {
      const score = mean(scores.map((e) => e.score100))
      return { ...toBeReturn, matching: { score, scores } }
    }
  }

  private fuseSearch(
    pattern: string,
    searchedIn: string,
    // threshold100: number,
  ) {
    const list = [searchedIn ?? []].flat().map((e) => ('' + e).trim())

    const fuseOptions = {
      includeScore: true,
      // isCaseSensitive: false,
      // shouldSort: true,
      // includeMatches: false,
      // findAllMatches: false,
      // minMatchCharLength: 1,
      // location: 0,
      // threshold: 1 - threshold100 / 100,
      // distance: 100,
      // useExtendedSearch: false,
      // ignoreLocation: false,
      // ignoreFieldNorm: false,
      // fieldNormWeight: 1,
      // keys: ['title', 'author.firstName'],
    }

    const fuse = new Fuse(list, fuseOptions)
    const tab = fuse.search(pattern.trim())
    const { score } = tab[0] ?? {}
    return Math.round(100 * (1 - (score ?? 1)))
  }

  help() {
    const message = `
-- Search help

* QUICK_SEARCH = match only if one of primary keys matches perfectly (utcode, mail)
* DEFAULT = search using fuse.js package (matching strings at best), if a primary key provided, it has to match
* DEEP_SEARCH = same as default, but keep searching even if primary key does not match

-- example:
searching: 
{utcode: 'UT123', first_name: 'Jean-Maurice', last_name: 'ALEXANDRE'}

in:
[{utcode: 'UT123', first_name: 'Jean-Maurice', last_name: 'ALEXANDRE', phone: '1'}, (GRANT) 
{utcode: '', first_name: 'Maurice Jean', last_name: 'ALEXANDRE', phone: '2'}] (MOVIUS)
{utcode: 'UT999', first_name: 'Jean-Maurice', last_name: 'ALEXANDRE', phone: '3'}] (UNIGY) [mistaken utcode]

result:
* QUICK_SEARCH = GRANT
* DEFAULT = GRANT MOVIUS
* DEEP_SEARCH = GRANT MOVIUS UNIGY
`
    console.log(message)
  }
}

export default new MetisService()
