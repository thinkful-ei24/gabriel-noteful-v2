'use strict';

const { app } = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const knex = require('../knex');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Noteful API', function() {
  const seedData = require('../db/seedData');

  beforeEach(function() {
    return seedData('./db/noteful.sql');
  });

  after(function() {
    return knex.destroy(); // destroy the connection
  });

  describe('GET /api/notes', function() {
    it('should return the default of 10 Notes ', function() {
      return chai
        .request(app)
        .get('/api/notes')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(10);
        });
    });

    it('should return correct search results for a valid query', function() {
      return chai
        .request(app)
        .get('/api/notes?searchTerm=about%20cats')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(4);
          expect(res.body[0]).to.be.an('object');
        });
    });
  });

  describe('404 handler', function() {
    it('should respond with 404 when given a bad path', function() {
      return chai
        .request(app)
        .get('/askfjlaso')
        .then(function(res) {
          expect(res).to.have.status(404);
        });
    });
  });

  describe('GET /api/notes', function() {
    it('should return an array of objects where each item contains id, title, and content', function() {
      const objectProps = ['id', 'title', 'content'];

      return chai
        .request(app)
        .get('/api/notes')
        .then(function(res) {
          expect(res.body).to.be.a('array');

          res.body.forEach(function(item) {
            expect(item).to.be.a('object');
            expect(item).to.include.keys(objectProps);
          });
        });
    });

    it('should return an empty array for an incorrect searchTerm', function() {
      return chai
        .request(app)
        .get('/api/notes?searchTerm=about%20catsaaaasdassa')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(0);
        });
    });
  });

  describe('GET /api/notes/:id', function() {
    it('should return correct note when given an id', function() {
      return chai
        .request(app)
        .get('/api/notes/1001')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
        });
    });

    it('should respond with a 404 for an invalid id', function() {
      return chai
        .request(app)
        .get('/api/notes/12189')
        .then(function(res) {
          expect(res).to.have.status(404);
        });
    });
  });

  describe('POST /api/notes', function() {
    it('should create and return a new item when provided valid data', function() {
      const newNote = {
        title: 'hello',
        content: 'goodbye',
        folder_id: 101,
        tags: [1, 2]
      };

      return chai
        .request(app)
        .post('/api/notes')
        .send(newNote)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys(
            'id',
            'title',
            'content',
            'tags',
            'folder_id'
          );
          expect(res.body.id).not.equal(null);
        });
    });

    it('should return an error when missing "title" field', function() {
      const newNote = {
        content: 'goodbye',
        folder_id: 101,
        tags: [1, 2]
      };

      return chai
        .request(app)
        .post('/api/notes')
        .send(newNote)
        .then(function(res) {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.id).not.equal(null);
        });
    });
  });

  describe('PUT /api/notes/:id', function() {
    it('should update the note', function() {
      const updateData = {
        title: 'herp',
        content: 'derp'
      };

      return chai
        .request(app)
        .get('/api/notes')
        .then(function(res) {
          updateData.id = res.body[0].id;

          return chai
            .request(app)
            .put(`/api/notes/${updateData.id}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(200);
        });
    });

    it('should respond with a 404 for an invalid id', function() {
      const updateData = {
        id: 52158,
        title: 'herp',
        content: 'derp'
      };

      return chai
        .request(app)
        .put('/api/notes/1565132')
        .send(updateData)
        .then(function(res) {
          expect(res).to.have.status(404);
        });
    });

    it('should return an error when missing "title" field', function() {
      const updateData = {
        content: 'herp'
      };

      return chai
        .request(app)
        .get('/api/notes')
        .then(function(res) {
          updateData.id = res.body[0].id;

          return chai
            .request(app)
            .put(`/api/notes/${updateData.id}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(400);
        });
    });
  });

  describe('DELETE  /api/notes/:id', function() {
    it('should delete an item by id', function() {
      return chai
        .request(app)
        .delete('/api/notes/1001')
        .then(function(res) {
          expect(res).to.have.status(204);
        });
    });
  });
});
