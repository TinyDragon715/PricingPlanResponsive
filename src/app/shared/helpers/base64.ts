// let base64url = require('base64-url');
// var Buffer = require('buffer/').Buffer;
export let urlSafeBase64Encoding = (str: string) => {
  // return base64url.encode(str);
  return btoa(str);
  // return new Buffer(str).toString('base64');
};
export let urlSafeBase64Decoding = (str: string) => {
  // return base64url.decode(str);
  return atob(str);
  // return Buffer.from(str, 'base64').toString('ascii');
};
