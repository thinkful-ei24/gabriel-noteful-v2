const express = require('express');
const router = express.Router();
const knex = require('../knex');

// Get All Folders (no search filter needed)
router.get('/folders', (req, res, next) => {
  knex
    .select('id', 'name')
    .from('folders')
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

// Get Folder by id
router.get('/folders/:id', (req, res, next) => {
  const id = req.params.id;

  knex
    .first('id', 'name')
    .from('folders')
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

// Update Folder The noteful app does not use this endpoint but we'll create it in order to round out our API
router.put('/folders/:id', (req, res, next) => {
  const id = req.params.id;
  const { name } = req.body;

  const updateObject = {
    name: name
  };
  console.log(updateObject);

  knex('folders')
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
    .catch(err => {
      next(err);
    });
});

// Create a Folder accepts an object with a name and inserts it in the DB. Returns the new item along the new id.
router.post('/folders', (req, res, next) => {
  const { name } = req.body;

  knex('folders')
    .insert({ name: name })
    .returning(['name', 'id'])
    .then(results => {
      res.status(201).json(results[0]);
    })
    .catch(err => next(err));
});

// Delete Folder By Id accepts an ID and deletes the folder from the DB and then returns a 204 status.
router.delete('/folders/:id', (req, res, next) => {
  const id = req.params.id;

  knex('folders')
    .del()
    .where('id', id)
    .then(results => {
      res.status(204).end();
    })
    .catch(err => next(err));
});

module.exports = router;
