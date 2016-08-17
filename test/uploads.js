'use strict';

require('co-mocha');
const Uploads = require('..');
const expect = require('chai').expect;
const fs = require('fs-extra');

const uploads = new Uploads('uploads');

const originals = {
  fs: {
    exists: fs.exists
  }
};

describe('lib/uploads', function () {

  describe('Uploads.fileNameGenerator', function () {
    it('should generate file names', function *() {
      let gen = Uploads.fileNameGenerator('test.txt');

      expect(gen.next().value).to.be.equal('test.txt');
      expect(gen.next().value).to.be.equal('test-2.txt');
      expect(gen.next().value).to.be.equal('test-3.txt');
      expect(gen.next().value).to.be.equal('test-4.txt');
      expect(gen.next().value).to.be.equal('test-5.txt');
    });
  });

  describe('generateSubDirName', function () {

    it('should generate names ok', function () {
      expect(Uploads.generateSubDirName(3, 3)).match(/^[a-z0-9]{3}\/[a-z0-9]{3}\/[a-z0-9]{3}$/);
      expect(Uploads.generateSubDirName(2, 3)).match(/^[a-z0-9]{2}\/[a-z0-9]{2}\/[a-z0-9]{2}$/);
      expect(Uploads.generateSubDirName(2, 1)).match(/^[a-z0-9]{2}$/);
      expect(Uploads.generateSubDirName(4, 1)).match(/^[a-z0-9]{4}$/);
      expect(Uploads.generateSubDirName(100, 1)).match(/^[a-z0-9]{100}$/);
      expect(Uploads.generateSubDirName(100, 2)).match(/^[a-z0-9]{100}\/[a-z0-9]{100}$/);
    });

  });

  describe('prepareFullPath', function () {

    it('should generate unique file name', function *() {
      var result;
      var i = 0 ;
      fs.exists = function () {
        return i++ < 3;
      };
      result = yield uploads.prepareFullFilePath('tmp', 'a.txt');
      expect(result.fullFilePath).to.match(/a-4.txt$/);

      result = yield uploads.prepareFullFilePath('tmp', 'b.txt');
      expect(result.fullFilePath).to.match(/b.txt$/);
    });

  });

  describe('write', function () {
    it('should write to the file', function *() {
      yield uploads.write('test', 'test.txt', 'hello world');
    });
  });

});