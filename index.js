'use strict';

const appRootDir = require('rootwd');
const path = require('path');
const mkdirp = require('mkdirp');
const fs = require('fs-extra');

module.exports = Uploads;

function Uploads(uploadDir, options) {
  this.setUploadDir(uploadDir);
  this.options = options || {};
};



/**
 *
 * @param dirNameLength
 * @param subDirCount
 * @returns {string}
 */
Uploads.generateSubDirName = function (dirNameLength, subDirCount) {
  var parts = [];
  dirNameLength = +dirNameLength || 2;
  subDirCount = +subDirCount || 3;

  var gen = Uploads.subDirNameGenerator(dirNameLength);

  for (let i = 0; i < subDirCount; i++) {
    parts.push(gen.next().value);
  }

  return parts.join('/');
};


/**
 *
 * @param length
 */
Uploads.subDirNameGenerator = function *subDirNameGenerator(length) {
  var string = '';

  while (true) {
    while (string.length < length) {
      string += Math.random().toString(36).substr(2);
    }

    let part = string.substr(0, length);
    string = string.substr(part.length - 1);
    yield part;
  }
}

/**
 *
 * @param filename
 */
Uploads.fileNameGenerator = function *fileNameGenerator(filename) {
  var extension = path.extname(filename);
  var basename = path.basename(filename, extension);
  var i = 1;

  yield filename;

  while (true) {
    let string = `${basename}-${++i}${extension}`;
    yield string;
  }
}


Uploads.prototype.getUploadDir = function () {
  return this.uploadDir;
};

/**
 *
 * @param uploadDir
 */
Uploads.prototype.setUploadDir = function (uploadDir) {
  if (uploadDir[0] !== '/') {
    uploadDir = path.resolve(appRootDir, uploadDir);
  }

  this.uploadDir = uploadDir;
};

/**
 *
 * @param subdir
 */
Uploads.prototype.prepareUploadDir = function*(subdir) {
  var dir = path.join(this.uploadDir, subdir);
  yield mkdirp.bind(mkdirp, dir);
  return dir;
};

/**
 *
 * @param file
 */
Uploads.prototype.getFullPath = function (file) {
  return path.join(this.uploadDir, file);
};

/**
 *
 * @param file
 * @returns {*}
 */
Uploads.prototype.unlink = function*(file) {
  var fullPath = path.join(this.uploadDir, file);

  var deleted = yield function (cb) {
    fs.unlink(fullPath, function (err) {
      cb(null, err === null);
    });
  };

  let dir = path.dirname(fullPath);

  /* jshint -W083 */
  while (true) {
    let directoryDeleted = yield function (cb) {
      fs.rmdir(dir, function (err) {
        cb(null, err === null);
      });
    };

    if (!directoryDeleted) {
      break;
    }

    dir = path.dirname(dir);

    if (dir === this.getUploadDir()) {
      break;
    }
  }

  return deleted;
};

/**
 *
 * @param uploadPath
 * @param fileName
 * @returns {*}
 */
Uploads.prototype.prepareFullFilePath = function *(uploadPath, fileName) {
  var fullDirPath = yield this.prepareUploadDir(uploadPath);
  var gen = Uploads.fileNameGenerator(fileName);
  var newFileName = gen.next().value;
  var fullFilePath;

  /* jshint -W083 */
  while (true) {
    fullFilePath = path.join(fullDirPath, newFileName);

    let exists = yield function (cb) {
      cb(null, fs.exists(fullFilePath));
    };

    if (!exists) {
      break;
    }

    newFileName = gen.next().value;
  }

  return {
    fullFilePath: fullFilePath,
    fileName: newFileName
  };
};

/**
 *
 * @param uploadPath
 * @param file
 */
Uploads.prototype.upload = function *(uploadPath, file) {
  var pathData = yield this.prepareFullFilePath(uploadPath, file.name);

  yield function (cb) {
    fs.move(file.path, pathData.fullFilePath, cb);
  };

  return path.join(uploadPath, pathData.fileName);
};

/**
 *
 * @param uploadPath
 * @param data
 * @returns {*|string}
 */
Uploads.prototype.write = function *(uploadPath, name, data) {
  var pathData = yield this.prepareFullFilePath(uploadPath, name);

  yield function (cb) {
    fs.writeFile(pathData.fullFilePath, data, cb);
  };

  return path.join(uploadPath, pathData.fileName);
};