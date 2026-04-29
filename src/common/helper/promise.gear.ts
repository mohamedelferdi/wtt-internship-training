import { MObject } from './constants'

const defaultConfig = {
  maxParalel: 3,
  doLog: true,
}

type Log = {
  start: number
  end: number
  status: '0_waiting' | '1_ready' | '2_processing' | '3_done'
}

export class PromisesGear {
  private config
  private strLogs: string[] = []
  private status: Log[] = []
  private stats = {
    process: '0/0',
    avgPromiseS: 0,
    maxPromiseS: 0,
    maxParalelReached: 1,
  }

  constructor(config?: Partial<typeof defaultConfig>) {
    this.config = { ...defaultConfig, ...(config ?? {}) }
  }

  async parallelize<T = any>(
    array: any[],
    promiseFunction: (arg: any) => Promise<T>,
  ): Promise<T[]> {
    // console.log(` > PromisesGear starting ...`, this.config)
    // INITIATION
    this.status = array.map((e, i) => {
      return {
        start: 0,
        end: 0,
        status: i < this.config.maxParalel ? '1_ready' : '0_waiting',
      }
    })

    // AFFICHAGE
    const defaultLog = console.log
    console.log = this.config.doLog ? defaultLog : () => null

    const progress: MObject = {}

    const results: T[] = await Promise.all(
      array.map(async (e, i) => {
        await this.standBy(i)

        const p = Math.round((100 * i) / array.length)

        const dizaine = Math.round(p / 10) * 10
        if (progress[dizaine] != 'OK') {
          progress[dizaine] = 'OK'
          console.info(progress)
        }

        this.status[i] = {
          ...this.status[i],
          start: new Date().getTime(),
          status: '2_processing',
        }

        const ret = promiseFunction(e)

        // END
        ret.finally(() => {
          this.status[i] = {
            ...this.status[i],
            end: new Date().getTime(),
            status: '3_done',
          }

          const nextIndex = this.status.findIndex(
            (e) => e.status === '0_waiting',
          )

          // luanch next
          if (nextIndex > -1) {
            this.status[nextIndex] = {
              ...this.status[nextIndex],
              status: '1_ready',
            }
          }
          // stats
          const { start, end } = this.status[i]
          const timeS = (end - start) / 1e3
          if (timeS > this.stats.maxPromiseS) {
            this.stats.maxPromiseS = timeS
          }

          if (this.stats.avgPromiseS === 0) {
            this.stats.avgPromiseS = timeS
          } else {
            this.stats.avgPromiseS = (timeS + this.stats.avgPromiseS) / 2
          }
          this.stats.process = `${i + 1}/${array.length}`
        })
        return ret
      }),
    )

    console.log = defaultLog
    console.log(`PromisesGear done`)
    console.log({
      ...this.stats,
      maxParalel: this.config.maxParalel,
    })
    return results
  }

  private standBy(i: number) {
    let refreshIntervalId: NodeJS.Timeout

    const promise = new Promise<void>((resolve, reject) => {
      refreshIntervalId = setInterval(async () => {
        const paralelCount = this.getParallelCount()
        if (this.status[i].status === '1_ready') {
          if (paralelCount < this.config.maxParalel) {
            resolve()
          }
        }
      }, 500)
    })

    promise.finally(() => clearInterval(refreshIntervalId))
    return promise
  }

  private getParallelCount() {
    const paralelCount = this.status.filter(
      (e) => e.start != 0 && e.end === 0,
    ).length

    if (paralelCount > this.stats.maxParalelReached) {
      this.stats.maxParalelReached = paralelCount
      // console.log(` > PromisesGear is processing ...`, this.stats)
    }

    return paralelCount
  }

  private logMe() {
    console.log(this.status)
    // process.stdout.write('/x1Bc') // clear terminal
    const time = new Date().getTime()
    const logs = this.status.map((e) => {
      const { start, end } = e
      const cond1 = start != 0 && start <= time
      const cond2 = end === 0 || time <= end
      const waiting = start === 0
      return cond1 && cond2 ? (waiting ? 'w' : '-') : ' '
    })

    this.strLogs = this.strLogs.map((str, i) => str + logs[i])

    const paralelCount = this.getParallelCount()
    const data = {
      stats: this.stats,
      paralelCount,
      config: this.config,
      status: this.status,
    }
    // shellService.createfile(data, `out/promisesgear/`, `${this.id}.json`)
  }
}

export async function sleep(
  timeoutMS: number = Math.round(Math.random() * 1000),
): Promise<void> {
  if (timeoutMS <= 0) {
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, timeoutMS)
  })
}

const defaultConfig_insist = {
  nbTry: 3,
  errorCallback: async (err: any) => Promise.resolve(1 as any),
  spacingMS: 2500,
}

export async function insist(
  action: () => any,
  config_?: Partial<typeof defaultConfig_insist>,
): Promise<{ data: any; error: any }> {
  const config: typeof defaultConfig_insist = {
    ...defaultConfig_insist,
    ...(config_ ?? {}),
  }

  const ret: any = { data: null, error: null }
  for (const iterator of [...Array(config.nbTry).keys()]) {
    try {
      ret.data = await action()
      break
    } catch (err: any) {
      const msg = `INSIST_FUNCTION_FAIL (tried: ${iterator + 1} time)`
      console.log(msg)
      console.log(err)
      await config.errorCallback(err)

      if (iterator === config.nbTry - 1) {
        ret.error = msg + ' MAX_TRY_REACHED'
      }
    }
    await sleep(config.spacingMS)
  }

  return ret
}
