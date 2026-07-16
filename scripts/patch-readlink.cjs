const fs = require("node:fs");
const fsPromises = require("node:fs/promises");

const originalReadlink = fs.readlink.bind(fs);
const originalReadlinkSync = fs.readlinkSync.bind(fs);
const originalReadlinkPromise = fsPromises.readlink.bind(fsPromises);

function coerceEisdirToEinval(error) {
  if (!error || error.code !== "EISDIR") {
    return error;
  }

  const patched = new Error(error.message);
  patched.name = error.name;
  patched.code = "EINVAL";
  patched.errno = error.errno;
  patched.syscall = error.syscall;
  patched.path = error.path;
  return patched;
}

fs.readlink = function patchedReadlink(path, options, callback) {
  if (typeof options === "function") {
    return originalReadlink(path, (error, linkString) => {
      options(coerceEisdirToEinval(error), linkString);
    });
  }

  return originalReadlink(path, options, (error, linkString) => {
    callback(coerceEisdirToEinval(error), linkString);
  });
};

fs.readlinkSync = function patchedReadlinkSync(path, options) {
  try {
    return originalReadlinkSync(path, options);
  } catch (error) {
    throw coerceEisdirToEinval(error);
  }
};

fsPromises.readlink = async function patchedReadlinkPromise(path, options) {
  try {
    return await originalReadlinkPromise(path, options);
  } catch (error) {
    throw coerceEisdirToEinval(error);
  }
};
