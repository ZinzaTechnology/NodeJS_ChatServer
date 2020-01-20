import nodemailer from 'nodemailer';
import nodeZip from 'node-zip';
import fs from 'fs';
import * as statusCode from '../constants/statusCode';
import * as Language from '../middlewares/language';
import config from '../../config/main';

// Export Contact
export function exportContact(req, res) {
  const zip = new nodeZip();
  let guidelinePath;
  const { email, data } = req.body;
  let lang = req.headers['x-localization'];

  if (lang == 'ja') {
    guidelinePath = './config/guideline_jp.pdf';
  } else {
    guidelinePath = './config/guideline_en.pdf';
  }

  if (!email || !data || email == '' || data == '') {
    return Language.getData(req, 'INVALID_PARAM').then(error => {
      res.status(statusCode.BAD_REQUEST).json({
        error
      });
    });
  }

  const transporter = nodemailer.createTransport({
    // Config Mail Server
    service: 'gmail',
    auth: {
      user: config.mail.user,
      pass: config.mail.password
    }
  });

  // abridged code

  const messOpitons = {
    // Message Option
    from: process.env.EMAIL,
    to: email,
    subject: 'Message Contacts',
    text:
      'This is Message contact information. Open guideline pdf and follow it to import contacts',
    attachments: [
      {
        filename: 'guideline.pdf',
        path: guidelinePath
      },
      {
        // abridged code
      }
    ]
  };

  // Send  Mail
  transporter
    .sendMail(messOpitons)
    .then(() => {
      res.status(statusCode.OK).json({
        Info: 'Contact is send to your email'
      });
    })
    .catch(err => {
      console.log(`Send email contact ${err}`);
      return Language.getData(req, 'UNKNOW_ERROR').then(error => {
        res.status(statusCode.BAD_REQUEST).json({
          error
        });
      });
    });
}
