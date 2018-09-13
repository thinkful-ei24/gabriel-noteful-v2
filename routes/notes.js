'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();
// Knex
const knex = require('../knex');
// Hydration
const hydrateNotes = require('../utils/hydrate');

// Get All (and search by query)
router.get('/', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;

  knex
    .select(
      'notes.id',
      'title',
      'content',
      'folders.id as folderId',
      'folders.name as folderName',
      'tags.id as tagId',
      'tags.name as tagName'
    )
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
    .modify(function(queryBuilder) {
      if (searchTerm) {
        queryBuilder.where('title', 'like', `%${searchTerm}%`);
      }
    })
    .modify(function(queryBuilder) {
      if (folderId) {
        queryBuilder.where('folder_id', folderId);
      }
    })
    .modify(function(queryBuilder) {
      if (tagId) {
        queryBuilder.where('tag_id', tagId);
      }
    })
    .orderBy('notes.id')
    .then(results => {
      const hydrated = hydrateNotes(results);
      res.json(hydrated);
    })
    .catch(err => {
      next(err);
    });
});

// Get a single item
router.get('/:id', (req, res, next) => {
  const id = req.params.id;

  getNoteByID(id)
    .then(result => {
      if (result) {
        const hydrated = hydrateNotes(result);
        res.json(hydrated[0]);
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
  const noteId = req.params.id;
  const { title, content, folderId, tags = [] } = req.body;

  /***** Never trust users. Validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const updateItem = {
    title: title,
    content: content,
    folder_id: folderId ? folderId : null
  };

  knex('notes')
    .update(updateItem)
    .where('id', noteId)
    .returning(['id'])
    .then(() => {
      // delete current tags from notes_tags
      return knex
        .del()
        .from('notes_tags')
        .where('note_id', noteId);
    })
    .then(() => {
      // insert tags into notes_tags
      const newTags = tags.map(tagId => ({ note_id: noteId, tag_id: tagId }));

      return knex.insert(newTags).into('notes_tags');
    })
    .then(() => {
      // Select the new note and leftJoin on folders and tags
      return getNoteByID(noteId);
    })
    .then(result => {
      // if result hydrate respond 200 and object
      // else 404
      if (result) {
        const hydrated = hydrateNotes(result)[0];
        res.status(200).json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

// Post (insert) an item
router.post('/', (req, res, next) => {
  const { title, content, folderId, tags = [] } = req.body;

  /***** Never trust users. Validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const newItem = {
    title: title,
    content: content,
    folder_id: folderId ? folderId : null
  };

  // Insert new note, instead of returning all the fields, just return the new `id`
  let noteId;

  knex
    .insert(newItem)
    .into('notes')
    .returning('id')
    .then(([id]) => {
      noteId = id;

      const newTags = tags.map(tagId => ({ note_id: noteId, tag_id: tagId }));

      return knex.insert(newTags).into('notes_tags');
    })
    .then(() => {
      return getNoteByID(noteId);
    })
    .then(result => {
      if (result) {
        const hydrated = hydrateNotes(result)[0];
        res
          .location(`${req.originalUrl}/${hydrated.id}`)
          .status(201)
          .json(hydrated);
      } else {
        next();
      }
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

function getNoteByID(id) {
  return knex
    .select(
      'notes.id',
      'title',
      'content',
      'folders.id as folder_id',
      'folders.name as folderName',
      'tags.id as tagId',
      'tags.name as tagName'
    )
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
    .where('notes.id', id);
}

module.exports = router;
