'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();
// Knex
const knex = require('../knex');

// Get All (and search by query)
router.get('/', (req, res, next) => {
  const { searchTerm } = req.query;

  knex
    .select('id', 'title', 'content')
    .from('notes')
    .modify(function(queryBuilder) {
      if (searchTerm) {
        queryBuilder.where('title', 'like', `%${searchTerm}%`);
      }
    })
    .orderBy('notes.id')
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

// Get a single item
router.get('/:id', (req, res, next) => {
  const id = req.params.id;

  knex
    .first('id', 'title', 'content')
    .from('notes')
    .where('id', id)
    .then(note => {
      if (note) {
        res.json(note);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

// Put update an item
router.put('/:id', (req, res, next) => {
  const id = req.params.id;

  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['title', 'content'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!updateObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  knex
    .from('notes')
    .update(updateObj)
    .where('id', id)
    // returns ID of object
    .returning('id')
    // then we run a query to get the array of obj
    .then(id => {
      return knex
        .first('id', 'title', 'content')
        .from('notes')
        .where('id', id[0]);
    })
    // then we return the first array obj
    .then(result => {
      console.log(result);
      return result;
    })
    // and send the status and response
    .then(result => {
      res.status(200).json(result);
    })
    .catch(err => next(err));
});

// Post (insert) an item
router.post('/', (req, res, next) => {
  const { title, content } = req.body;

  const newItem = { title, content };
  /***** Never trust users - validate input *****/
  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  knex
    .insert({
      title: newItem.title,
      content: newItem.content
    })
    .into('notes')
    .returning('id')
    .then(id => {
      return id[0];
    })
    .then(id => {
      return knex
        .first('id', 'title', 'content')
        .from('notes')
        .where('id', id);
    })
    .then(result => {
      console.log(result);
      res
        .location(`http://${req.headers.host}/notes/${result.id}`)
        .status(201)
        .json(result);
    })
    .catch(err => next(err));
});

// Delete an item
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;

  knex
    .del()
    .from('notes')
    .where('id', id)
    .then(() => {
      res.status(204).send();
    })
    .catch(err => next(err));
});

module.exports = router;
