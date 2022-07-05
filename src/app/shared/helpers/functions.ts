export function fromArray(data: [any] | any[]): any | undefined {
  for (let json of data) {
      if (json === undefined) {
        return undefined;
      }
  }
  return data;
}
export function containsObject(obj: any, list: [any] | any[]): boolean {
  for (let i = 0; i < list.length; i++) {
      if (list[i] === obj) {
          return true;
      }
  }
  return false;
}
export function roundDecimal(value, decimals): number {
 return Number(Number(value).toFixed(decimals));
}
export function containsSlashBeg(myUrl){
  if (myUrl.substr(0, 1) === '/')
  {
      myUrl = myUrl.substr(1, myUrl.length);
  }

  return myUrl;
}
export function getRandomInt(min, max) {
  // public random = Math.floor(Math.random() * (999999 - 100000)) + 100000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function randomExcluded(start, end, excluded) {
    if(start >= end){
      return start;
    }
    var n = excluded
    while (n == excluded)
        n = Math.floor((Math.random() * (end-start+1) + start));
    return n;

}
export function parseJSON(str) {
try {
    return JSON.parse(str);
} catch (e) {
    return str;
}
}
export function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}
export function validateSite(email) {
  const re = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return !!re.test(email);
}
export function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}
export function Utf8Encode(data) {
data = data.replace(/\r\n/g, '\n');
let utftext = '';

for (let n = 0; n < data.length; n++) {

  let c = data.charCodeAt(n);

  if (c < 128) {
    utftext += String.fromCharCode(c);
  } else if ((c > 127) && (c < 2048)) {
    utftext += String.fromCharCode((c >> 6) | 192);
    utftext += String.fromCharCode((c & 63) | 128);
  } else {
    utftext += String.fromCharCode((c >> 12) | 224);
    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
    utftext += String.fromCharCode((c & 63) | 128);
  }

}

return utftext;
};
export function hexToRgbA(hex, opacity = 1){
  let c;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
      c = hex.substring(1).split('');
      if (c.length === 3){
          c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c = '0x' + c.join('');
      return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + opacity + ')';
  }
  throw new Error('Bad Hex');
}
export function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}
