import { EventBusy } from '@mui/icons-material'
import {
  Box,
  Button,
  Chip,
  Container,
  List,
  ListDivider,
  ListItem,
  ListItemContent,
  Typography,
} from '@mui/joy'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { GetThingHistory } from '../../utils/Fetcher'
import LoadingComponent from '../components/Loading'

const ThingsHistory = () => {
  const { id } = useParams()
  const [thingsHistory, setThingsHistory] = useState([])
  const [noMoreHistory, setNoMoreHistory] = useState(false)
  const [errLoading, setErrLoading] = useState(false)
  useEffect(() => {
    GetThingHistory(id, 0, 10).then(resp => {
      if (resp.ok) {
        resp.json().then(data => {
          setThingsHistory(data.res)
          if (data.res.length < 10) {
            setNoMoreHistory(true)
          }
        })
      } else {
        setErrLoading(true)
      }
    })
  }, [])

  const handleLoadMore = () => {
    GetThingHistory(id, thingsHistory.length).then(resp => {
      if (resp.ok) {
        resp.json().then(data => {
          setThingsHistory([...thingsHistory, ...data.res])
          if (data.res.length < 10) {
            setNoMoreHistory(true)
          }
        })
      }
    })
  }

  const formatTimeDifference = (startDate, endDate) => {
    const diffInMinutes = moment(startDate).diff(endDate, 'minutes')
    let timeValue = diffInMinutes
    let unit = 'minute'

    if (diffInMinutes >= 60) {
      const diffInHours = moment(startDate).diff(endDate, 'hours')
      timeValue = diffInHours
      unit = 'hour'

      if (diffInHours >= 24) {
        const diffInDays = moment(startDate).diff(endDate, 'days')
        timeValue = diffInDays
        unit = 'day'
      }
    }

    return `${timeValue} ${unit}${timeValue !== 1 ? 's' : ''}`
  }
  // if loading show loading spinner:
  if (thingsHistory.length === 0) {
    return <LoadingComponent />
  }

  if (errLoading || !thingsHistory || thingsHistory.length === 0) {
    return (
      <Container
        maxWidth='md'
        sx={{
          textAlign: 'center',
          display: 'flex',
          // make sure the content is centered vertically:
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          height: '50vh',
        }}
      >
        <EventBusy
          sx={{
            fontSize: '6rem',
            // color: 'text.disabled',
            mb: 1,
          }}
        />

        <Typography level='h3' gutterBottom>
          No history found
        </Typography>
        <Typography level='body1'>
          It's look like there is no history for this thing yet.
        </Typography>
        <Button variant='soft' sx={{ mt: 2 }}>
          <Link to='/things'>Go back to things</Link>
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth='md'>
      <Typography level='h3' mb={1.5}>
        History:
      </Typography>
      {/* check if all the states are number the show it: */}
      {thingsHistory.every(history => !isNaN(history.state)) &&
        thingsHistory.length > 1 && (
          <>
            <Typography level='h4' gutterBottom>
              Chart:
            </Typography>

            <Box sx={{ borderRadius: 'sm', p: 2, boxShadow: 'md', mb: 2 }}>
              <ResponsiveContainer width='100%' height={200}>
                <LineChart
                  width={500}
                  height={300}
                  data={thingsHistory.toReversed()}
                >
                  {/* <CartesianGrid strokeDasharray='3 3' /> */}
                  <XAxis
                    dataKey='updatedAt'
                    hide='true'
                    tick='false'
                    tickLine='false'
                    axisLine='false'
                    tickFormatter={tick =>
                      moment(tick).format('ddd MM/DD/yyyy HH:mm:ss')
                    }
                  />
                  <YAxis
                    hide='true'
                    dataKey='state'
                    tick='false'
                    tickLine='true'
                    axisLine='false'
                  />
                  <Tooltip
                    labelFormatter={label =>
                      moment(label).format('ddd MM/DD/yyyy HH:mm:ss')
                    }
                  />

                  <Line
                    type='monotone'
                    dataKey='state'
                    stroke='#8884d8'
                    activeDot={{ r: 8 }}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </>
        )}
      <Typography level='h4' gutterBottom>
        Change log:
      </Typography>
      <Box sx={{ borderRadius: 'sm', p: 2, boxShadow: 'md' }}>
        <List sx={{ p: 0 }}>
          {thingsHistory.map((history, index) => (
            <>
              <ListItem sx={{ gap: 1.5, alignItems: 'flex-start' }}>
                <ListItemContent sx={{ my: 0 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography level='body1' sx={{ fontWeight: 'md' }}>
                      {moment(history.updatedAt).format(
                        'ddd MM/DD/yyyy HH:mm:ss',
                      )}
                    </Typography>
                    <Chip>{history.state}</Chip>
                  </Box>
                </ListItemContent>
              </ListItem>
              {index < thingsHistory.length - 1 && (
                <>
                  <ListDivider component='li'>
                    {/* time between two completion: */}
                    {index < thingsHistory.length - 1 &&
                      thingsHistory[index + 1].createdAt && (
                        <Typography level='body3' color='text.tertiary'>
                          {formatTimeDifference(
                            history.createdAt,
                            thingsHistory[index + 1].createdAt,
                          )}{' '}
                          before
                        </Typography>
                      )}
                  </ListDivider>
                </>
              )}
            </>
          ))}
        </List>
      </Box>
      {/* Load more Button  */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 2,
        }}
      >
        <Button
          variant='plain'
          fullWidth
          color='primary'
          onClick={handleLoadMore}
          disabled={noMoreHistory}
        >
          {noMoreHistory ? 'No more history' : 'Load more'}
        </Button>
      </Box>
    </Container>
  )
}

export default ThingsHistory
