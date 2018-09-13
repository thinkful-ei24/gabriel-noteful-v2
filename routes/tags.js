const express = require('express');
const router = express.Router();
const knex = require('../knex');

// GET all
router.get('/tags', (req, res, next) => {
  knex
    .select('id', 'name')
    .from('tags')
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

// GET one by ID
router.get('/tags/:id', (req, res, next) => {
  const { id } = req.params;

  knex
    .first('id', 'name')
    .from('tags')
    .where('id', id)
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

/* ========== POST/CREATE ITEM ========== */
router.post('/tags', (req, res, next) => {
  const { name } = req.body;

  /***** Never trust users. Validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const newItem = { name };

  knex
    .insert(newItem)
    .into('tags')
    .returning(['id', 'name'])
    .then(results => {
      // Uses Array index solution to get first item in results array
      const result = results[0];
      res
        .location(`${req.originalUrl}/${result.id}`)
        .status(201)
        .json(result);
    })
    .catch(err => next(err));
});

// PUT
router.put('/tags/:id', (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;

  const updateObject = {
    name: name
  };

  knex
    .from('tags')
    .update(updateObject)
    .where('id', id)
    .returning(['id', 'name'])
    .then(([result]) => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

// DELETE
router.delete('/tags/:id', (req, res, next) => {
  const { id } = req.params;

  knex
    .del()
    .from('tags')
    .where('id', id)
    .then(() => {
      res.status(204).end();
    })
    .catch(err => next(err));
});

module.exports = router;
