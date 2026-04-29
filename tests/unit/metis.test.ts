import { IUser } from '../../src/services/metis/domain/metis.interface'
import metisService from '../../src/services/metis/application/metis.service'

const emptyForm = {
  utcode: '',
  first_name: '',
  last_name: '',
  phone: '',
  mail: '',
}

describe('utcode: testing metis match criterias', () => {
  const form: IUser = {
    utcode: 'ut2ewx',
    first_name: '',
    last_name: '',
    mail: '',
    phone: '',
  }

  test('should not match with empty search criterias', () => {
    const result = metisService.userDoesMatchCriterias(emptyForm, emptyForm)
    expect(result).toBeUndefined()
  })

  test('utcode: should match in a case insensitive comparaison', () => {
    const searched = {
      utcode: 'UT2EWX',
      first_name: '',
      last_name: '',
      mail: '',
      phone: '',
    }
    const result = metisService.userDoesMatchCriterias(form, searched)
    expect(result).toBeDefined()
  })

  test('utcode: should not match with a different utcode', () => {
    const searched = {
      utcode: 'UT312X',
      first_name: '',
      last_name: '',
      mail: '',
      phone: '',
    }
    const result = metisService.userDoesMatchCriterias(form, searched)
    expect(result).toBeUndefined()
  })
})

describe('name: testing metis match criterias', () => {
  const form: IUser = {
    utcode: '',
    first_name: 'John',
    last_name: 'DOE',
    mail: '',
    phone: '',
  }

  test('name: should match in a case insensitive', () => {
    const searched = {
      utcode: '',
      first_name: 'John',
      last_name: 'DOE',
      mail: '',
      phone: '',
    }
    const result = metisService.userDoesMatchCriterias(form, searched)
    expect(result).toBeDefined()
  })

  test('name: should match when first_name/last_name same as last_name/first_name', () => {
    const searched = {
      utcode: '',
      first_name: 'DOE',
      last_name: 'John',
      mail: '',
      phone: '',
    }
    const result = metisService.userDoesMatchCriterias(form, searched)
    expect(result).toBeDefined()
  })

  test('name: should not match when first_name/last_name different than last_name/first_name', () => {
    const searched = {
      utcode: '',
      first_name: 'deo',
      last_name: 'Jhone',
      mail: '',
      phone: '',
    }
    const result = metisService.userDoesMatchCriterias(form, searched)
    expect(result).toBeUndefined()
  })
})

describe('phone: testing metis match criterias', () => {
  const form: IUser = {
    utcode: '',
    first_name: '',
    last_name: '',
    phone: '+3312345678',
    mail: '',
  }

  test('phone: should match with same phone number', () => {
    const searched = {
      utcode: '',
      first_name: '',
      last_name: '',
      phone: '+3312345678',
      mail: '',
    }
    const result = metisService.userDoesMatchCriterias(form, searched)
    expect(result).toBeDefined()
  })

  test('phone: should not match when different phone numbers', () => {
    const searched = {
      utcode: '',
      first_name: '',
      last_name: '',
      phone: '+3312346587',
      mail: '',
    }
    const result = metisService.userDoesMatchCriterias(form, searched)
    expect(result).toBeUndefined()
  })
})

