import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { shortISO, isDate } from '../../utils/date-wrangler'
import { getGrid, transformBookings } from './grid-builder'
import getData from '../../utils/api'

export function useBookings(bookableId, startDate, endDate) {
  const start = shortISO(startDate)
  const end = shortISO(endDate)

  const urlRoot = 'http://localhost:3001/bookings'

  const queryString =
    `bookableId=${bookableId}` + `&date_gte=${start}&date_lte=${end}`

  // [10.4.2] useQuery can take an array as the query key, as well as a string
  // const { data, status, error } = useQuery(key, () => fetch(url))
  const query = useQuery(['bookings', bookableId, start, end], () =>
    getData(`${urlRoot}?${queryString}`)
  )

  return {
    bookings: query.data ? transformBookings(query.data) : {},
    ...query
  }
}

export function useGrid(bookable, startDate) {
  return useMemo(
    () => (bookable ? getGrid(bookable, startDate) : {}),
    [bookable, startDate]
  )
}

// [10.3] using query string and search parameters to extract state values from the url
// the alternative of (10.1) using path attributes to extract state from the url
// here the qs is everything after ?  , search params are key1 and key2
//  /path/to/page?key1=value1&key2=value2

export function useBookingsParams() {
  // [10.3.1] access the search params with useSearchParams hooks, and get
  const [searchParams, setSearchParams] = useSearchParams()
  const searchDate = searchParams.get('date')
  const bookableId = searchParams.get('bookableId')

  // [10.3.2] consider the possible invalid values of the search params and take precautions
  // use statistics: 2 query strings having valid vs invalid boolean values: 4 outcomes

  // take it if it's a valid date, otherwise use today
  const date = isDate(searchDate) ? new Date(searchDate) : new Date()

  // create a number from the string of bookableId the search parameter,
  // use it if it's a valid number, otherwise use undefined
  const idInt = parseInt(bookableId, 10)
  const hasId = !isNaN(idInt)

  /** Updates the qs search params with a new date */
  function setBookingsDate(date) {
    const params = {}

    if (hasId) {
      params.bookableId = bookableId
    }
    if (isDate(date)) {
      params.date = date
    }

    if (params.date || params.bookableId !== undefined) {
      // [10.3.3] update the qs search params with the new values
      // replace: true prevents each visited date from appearing in the browser’s history,
      // the browser’s Back button won’t step back through each date
      setSearchParams(params, { replace: true })
    }
  }

  return {
    date,
    bookableId: hasId ? idInt : undefined,
    setBookingsDate
  }
}
