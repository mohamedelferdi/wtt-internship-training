import exceljs from 'exceljs'
import _ from 'lodash'
import { MObject } from '../../constants'

const distinctsColors = [
  '#dde8cb',
  '#ffd7d7',
  '#fff5ce',
  '#dee6ef',
  // '#FDE9D9',
  // '#92CDDC',
  // '#E6B8B7',
  // '#D8E4BC',
  // '#FCD5B4',
  // '#B7DEE8',
  // '#DAEEF3',
  // '#C4D79B',
  // '#F2DCDB',
  // '#B8CCE4',
  // '#DCE6F1',
  // '#E4DFEC',
  // '#C5D9F1',
  // '#DDD9C4',
  // '#EBF1DE',
  // '#D9D9D9',
  // '#CCC0DA',
  // '#8DB4E2',
  // '#C4BD97',
  // '#95B3D7',
]

const GREY = `#b2b2b2`

export type IOptions_xlsx = {
  includeAllColumns?: boolean
  columns_ToColorGrouped?: string[]
  columns_ToGrey?: string[]
  columns_ToColorHeaders?: (
    | { headers: string[]; color?: string }
    | { regex: RegExp; color?: string }
  )[]
  modules?: {
    column: string
    minimize?: true
    range?: number[]
    coef?: number
  }[]
  sort?: { column: string; desc?: true }[]
}

interface IColorCell {
  pattern: string | null
  column: string | null
  bg: string | null
  txt?: string
}

class ExcelService {
  async createfile(
    data: MObject[],
    FullPathFilenameDotFormat: string,
    options: IOptions_xlsx = {},
  ): Promise<void> {
    if (data.length === 0) {
      return
    }

    const stylingToColor: IColorCell[] = []

    /* STYLING columns_ToColorGrouped*/
    const columns_ToColorGrouped: string[] =
      options.columns_ToColorGrouped ?? []
    columns_ToColorGrouped.map((column) => {
      const values = [...new Set(data.map((e) => e[column]))]
      values.map((pattern, i) => {
        const bg = distinctsColors[i % distinctsColors.length]
        pattern && stylingToColor.push({ column, pattern, bg })
      })
    })
    options.columns_ToGrey?.map((column) => {
      const values = [...new Set(data.map((e) => e[column]))]
      values.map((pattern, i) => {
        stylingToColor.push({ column, pattern, bg: GREY })
      })
    })

    /* MATHS+STYLING modules*/
    const modules = options.modules ?? []
    const allNotes = modules.map((e) => {
      const { column, range, minimize } = e
      const values = data.map((e) => +e[column])
      const pers = this.getIndexes(values, minimize, range)
      values.map((value, i) => {
        const per = pers[i]
        stylingToColor.push({
          column: `per_${column}`,
          pattern: '' + per,
          bg: this.getColor(per),
        })
      })
      data = data.map((e, i) => ({ ...e, [`per_${column}`]: pers[i] }))
      return pers
    })

    // adding moyenne
    if (modules.length > 0) {
      const totalCoef = _.sum(modules.map((e) => e.coef ?? 1))
      data = data.map((e, i) => {
        const notes = allNotes.map((ee, ii) => ee[i])
        modules[0]?.coef
        const tmp = notes.map((note, ii) => note * (modules[ii]?.coef ?? 1))
        const totalNote = _.sum(tmp)

        const out = notes.find((e) => this.perIsOutScope(e))
        const moy = out ?? Math.round(totalNote / totalCoef)

        stylingToColor.push({
          column: `moy`,
          pattern: '' + moy,
          bg: this.getColor(moy),
        })
        return { ...e, [`moy`]: moy }
      })
    }

    /* DATA filling */
    const colomnsToColors = [
      ...columns_ToColorGrouped,
      ...modules
        .sort((a, b) => (a.coef ?? 1) - (b.coef ?? 1))
        .map((e) => 'per_' + e.column),
      'moy',
    ]
    // colomnsToColors.slice(1).map((column) => {
    //   data.sort((a, b) => b[column] - a[column])
    // })

    // filling sheet
    const workbook = new exceljs.Workbook()
    const worksheet = workbook.addWorksheet('page')

    const keys =
      options.includeAllColumns === true
        ? [...new Set(data.flatMap((e) => Object.keys(e)))]
        : Object.keys(data[0])

    worksheet.columns = keys.map((header) => ({ header, key: header }))

    // sorting
    options.sort?.map(({ column, desc }) => {
      const sample = data[0][column]
      const coef = desc ? -1 : 1
      const f =
        typeof sample === 'number'
          ? (a: MObject, b: MObject) => (a[column] - b[column]) * coef
          : (a: MObject, b: MObject) =>
              ('' + a[column]).localeCompare('' + b[column]) * coef
      data = data.sort(f)
    })
    data.forEach((element: MObject) => worksheet.addRow(element))
    // firstRow
    const firstRow = worksheet.getRow(1)
    firstRow.alignment = { horizontal: 'center' }
    firstRow.font = { bold: true, name: 'Calibri' }

    firstRow.eachCell((cell) => {
      const columnName = '' + cell.value
      const foundIndex = (options.columns_ToColorHeaders ?? []).findIndex(
        (e) => {
          return (
            (e as any).headers?.includes(columnName) ||
            (e as any).regex?.test(columnName)
          )
        },
      )

      const color =
        foundIndex === -1
          ? 'FFFFCC'
          : options.columns_ToGrey?.includes(columnName)
            ? GREY
            : (options.columns_ToColorHeaders?.[foundIndex]?.color ??
              distinctsColors[distinctsColors.length - foundIndex - 1])

      this.exeljsColorBGCell(cell, color)
    })

    // appliying color
    worksheet.eachColumnKey((column) => {
      const colomnName = '' + column.key
      // const shoudlColor = colomnsToColors.includes(colomnName)
      // if (!shoudlColor) {
      //   return
      // }
      column.eachCell((cell) => {
        const found = stylingToColor.find((e) => {
          return colomnName === e.column && '' + e.pattern === '' + cell.value
        })

        if (found == null) {
          return
        }
        const { bg, txt } = found
        this.exeljsColorBGCell(cell, bg, txt)
      })
    })

    await workbook.xlsx.writeFile(FullPathFilenameDotFormat)
  }

  async readfile(FullPathFilenameDotFormat: string): Promise<any> {
    const workbook = new exceljs.Workbook()
    const file = await workbook.xlsx.readFile(FullPathFilenameDotFormat)
    const worksheet = file.getWorksheet(1)

    if (worksheet == null) {
      console.error(
        `fail to read ${FullPathFilenameDotFormat} file. Verify yout file.`,
      )
      return
    }

    //Put first row of file as keys of the array of objects (result)
    const keys: string[] = []
    worksheet.getRow(1).eachCell((cell) => {
      keys.push(cell.value as string)
    })

    const data: MObject[] = []
    // for each row, creating object then push it in the array
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const oneRow: MObject = {}
      worksheet?.getRow(rowNumber).eachCell((cell, colNumber) => {
        const key = keys[colNumber - 1]
        oneRow[key] = cell.value
      })
      data.push(oneRow)
    }

    return data
  }

  private getIndexes(values: number[], minimize = false, range: number[] = []) {
    const sorted = structuredClone(values).sort((a, b) => a - b)

    const mn = sorted[0]
    const min = Math.max(mn, range[0] ?? mn)

    const mx = sorted[sorted.length - 1]
    const max = Math.min(mx, range[1] ?? mx)

    const minors = sorted.filter((e) => e < min)
    const majors = sorted.filter((e) => e > max)
    const others = sorted.filter(
      (e) => !minors.includes(e) && !majors.includes(e),
    )

    const distincs = [...new Set(others)]
    const ret = values.map((value) => {
      let per = -2

      if (minors.includes(value)) {
        per = minimize ? -2 : -1
        return per
      }

      if (majors.includes(value)) {
        per = minimize ? -1 : -2
        return per
      }
      const i = distincs.findIndex((e) => e === value)

      const n = distincs.length
      per = Math.round((100 * (minimize ? n - i : i)) / n)
      return per
    })

    return ret
  }

  private exeljsColorBGCell(
    cell: exceljs.Cell,
    bgHexColor: string | null,
    txtHexColor?: string,
  ) {
    if (bgHexColor == null && txtHexColor == null) {
      return
    }

    if (bgHexColor != null) {
      let color = bgHexColor.replace('#', '')
      if (color.length > 6) {
        color =
          color[color.length - 2] + color[color.length - 1] + color.slice(0, -2)
      }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: color },
      }
    }

    if (txtHexColor != null) {
      cell.font = {
        color: { argb: txtHexColor.replace('#', '') },
        name: 'Calibri',
      }
    }

    const s = { style: 'hair', color: { argb: 'CCCCCC' } }
    const border = Object.assign(
      {},
      ...['top', 'right', 'bottom', 'left'].map((k) => ({ [k]: s })),
    )
    cell.border = border
  }

  private getColor = (per: number): string => {
    if (this.perIsOutScope(per)) {
      return '#808080'
    }
    const r = Math.round(255 - per * 2.55)
      .toString(16)
      .padStart(2, '0')
    const g = Math.round(per * 2.55)
      .toString(16)
      .padStart(2, '0')
    const b = Math.round(0).toString(16).padStart(2, '0')
    return `#${r}${g}${b}`
  }

  private perIsOutScope = (per: number): boolean => {
    return per < 0 || per > 100
  }
}

export default new ExcelService()
