'use strict';

const joi = require('joi');
const hu = require('../lib/handler-utils');

module.exports = (route, options) => {
  const Model = options.model;

  return (req, reply) => {

    const condition = hu.getIdQuery(options, req);
    req.payload[options.idKey] = hu.getId(options, req);

    const query = Model.update(condition, req.payload, {
      overwrite: options.overwrite,
      upsert: options.upsert,
    }).lean();

    if (options.preQuery) options.preQuery(query); // query extension point
    query.exec((err, res) => {

      if (err) return hu.handleError(err, reply);
      Model.findOne(condition).lean().exec((err, item) => {

        if (options.transformResponse) item = options.transformResponse(item, req, reply);
        if (res.upserted !== undefined) reply(item).code(201); // create
        else reply(item); // update
        if (options.afterResponse) item = options.afterResponse(item, req);
      })
    });
  };
};

module.exports.validOptions = {
  overwrite: joi.boolean().default(true), // "true" PUT by default – overwrite doc
  upsert: joi.boolean().default(true),
  afterResponse: joi.func().maxArity(2),
  idKey: hu.schemas.idKey,
};
