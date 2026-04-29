import nodemailer from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'

const MAILER_HOST = process.env.MAILER_HOST ?? ''
const MAILER_FROM_DEFAULT = process.env.MAILER_FROM_DEFAULT ?? ''
const MAILER_TO_DEFAULT = process.env.MAILER_TO_DEFAULT ?? ''

const fedHostTransporter = nodemailer.createTransport({
  host: MAILER_HOST,
  port: 25,
  // logger: true,
  // debug: true,
})

class MailerService {
  async sendOneMail(
    mailOptions: Mail.Options,
    transporters?: nodemailer.Transporter | nodemailer.Transporter[],
    fallover = false,
  ): Promise<string> {
    const list = [transporters ?? []].flat()
    if (list.length === 0 || fallover === true) {
      list.push(fedHostTransporter)
    }
    const errors: string[] = []
    for (const transporter of list) {
      try {
        const log = await this.sendOneMailAtomic(mailOptions, transporter)
        return log
      } catch (error) {
        console.error(error)
        errors.push('' + error)
      }
    }
    throw errors.join('\n')
  }

  private sendOneMailAtomic(
    mailOptions: Mail.Options,
    transporter: nodemailer.Transporter = fedHostTransporter,
  ): Promise<string> {
    // set default
    const from = mailOptions.from ?? MAILER_FROM_DEFAULT
    const to = mailOptions.to ?? MAILER_TO_DEFAULT

    mailOptions = { ...mailOptions, from, to }
    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error != null) {
          // TODO:
          // const mErr = { transporter, mailOptions, error }
          // const errStr = shellService.objectToString('' + error)
          reject('' + error)
          return
        }
        const msg = info?.response
        resolve(msg)
      })
    })
  }
}

export default new MailerService()
