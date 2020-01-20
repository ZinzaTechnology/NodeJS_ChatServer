import User from '../models/user';
import Message from '../models/message';
import Conversation from '../models/conversation';
import * as statusCode from '../constants/statusCode';

export function checkNumDb (req, res) {
  let user, message, conversation;
  User.count((err, numUser) => {
    if (err) {res.status(statusCode.UNPROCESSABLE_ENTITY);}
    user = numUser;
    // abridged code
  });
}

export function user (req, res) {
  User.find()
    .sort('-updatedAt')
    .limit(Number(req.params.num))
    .exec((err, users) => {
      if (err) {res.status(statusCode.UNPROCESSABLE_ENTITY);}
      res.status(statusCode.OK).json(users);
    });
}

export function conversation (req, res) {
  Conversation.find()
    .sort('-updatedAt')
    .limit(Number(req.params.num))
    .exec((err, conversations) => {
      if (err) {res.status(statusCode.UNPROCESSABLE_ENTITY);}
      res.status(statusCode.OK).json(conversations);
    });
}

export function message (req, res) {
  Message.find()
    .sort('-sa')
    .limit(Number(req.params.num))
    .exec((err, messages) => {
      if (err) {res.status(statusCode.UNPROCESSABLE_ENTITY);}
      res.status(statusCode.OK).json(messages);
    });
}

export function findUserMessages (req, res) {
  User.findOne({sn: Number(req.params.sn)})
    .exec((err, user) => {
      if (err) {res.status(statusCode.UNPROCESSABLE_ENTITY);}
      if (!user) {
        res.status(statusCode.OK).json({info: 'No user was found in the DB'});
      } else {
        Message.find({au: user._id})
          // abridged code
      }
    });
}

export function findMessage (req, res) {
  Message.find({_id: req.params._id})
    .exec((err, message) => {
      if (err) {res.status(statusCode.UNPROCESSABLE_ENTITY);}
      if (message.length == 0) {
        res.status(statusCode.OK).json({info: 'No message was found in the DB'});
      } else {
        res.status(statusCode.OK).json(message);
      }
    });
}