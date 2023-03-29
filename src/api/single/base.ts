import httpClient from '~/src/library/http'
class Base {
  static readonly http = httpClient
  static readonly CONST_SORT_BY_CREATED = 'created'
}

export default Base
