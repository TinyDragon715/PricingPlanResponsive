import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Dictionary, invoiceItem, invoiceCreateResponse, invoiceCreateItemResponse, invoice, itemsRef, subscriptionObject, packageObject } from './interface';
import { ContentType } from './enums';
import { StoreService } from './store.service';
import { Utils } from '../helpers/utils';
// import { NgxPermissionsService, NgxRolesService } from 'ngx-permissions';
import { NgxPermissionsService, NgxRolesService } from '../modules/ngx-permissions';
import { urlSafeBase64Encoding } from '../helpers';
import { environment as checkoutEnv } from "../../../environments/environment.registration"
import { truncate } from 'lodash';
import { env } from 'process';
import * as moment from 'moment';


interface filterObject {
  count?: number;
  exclude?: []
  include?: []
  order?: { field: string; order: string }[]
  page?: number
  pagenationToken?: string
  term?: string
  fields?: string[]
  filter?: { field_name: string }
}

interface UserObject {
  email?: string
  password?: string
  active?: boolean,
  name?: string
  id?: number
  firstName?: string
  lastName?: string
}

type responseCallback = (dataResponse: any | undefined, requestError: any | undefined) => any;
@Injectable()
export class RequestService {
  private authURL = environment.serverUrl;
  private v1ServerUrl = environment.serverV1Url;
  private orgType = environment.orgType;
  private checkoutReqUrl = checkoutEnv.serverUrl;
  private loading: boolean = false;
  private token: any = '';
  private userType: string = 'default';
  public loginEnteredIds = undefined;
  public orgId = undefined;
  public appId = undefined;
  public locId = undefined;
  public lang = 'en';
  public environmentserverHostUrl = environment.serverUrl;
  public serverHostUrl = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
  public appStatusSubject: BehaviorSubject<string> = new BehaviorSubject<string>(undefined);
  public authenticatedUser: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public pageOrganization: BehaviorSubject<any> = new BehaviorSubject<any>(undefined);
  private cachedObj = {};
  private checkoutCachedObj = {};
  public currentUserSubject: BehaviorSubject<any | undefined> = new BehaviorSubject<any | undefined>(undefined);
  public _currentUser: any | undefined = undefined;
  set currentUser(currentUser: any | undefined) {
    if (currentUser) {
      this._currentUser = currentUser;
      let userObject: any = currentUser;
      this.userType = currentUser.type || 'default';
      this.store.init('default');
      this.setToken(userObject.token);
      this.currentUserSubject.next(userObject);
      // this.store.set('te', 'temp');
      this.permissionsService.flushPermissions();
      if (currentUser.isSuperAdmin) {
        this.permissionsService.addPermission(environment.customKeys.roleAdmin);
      }
      // for (let res of userObject.resources) {
      //   this.permissionsService.addPermission(res._id);
      // }
    } else {
      this._currentUser = undefined;
      this.orgId = undefined;
      this.currentUserSubject.next(undefined);
      this.token = '';
      this.userType = 'default';
      this.store.init('default');
      this.permissionsService.flushPermissions();
    }
  }
  get currentUser(): any | undefined {
    return this._currentUser;
  }
  public updateCurrentUser(newData: any) {
    let objectUser = Object.assign(this._currentUser, newData);
    this.currentUser = objectUser;
  }
  public updatePermissions(resources: any) {
    this.permissionsService.flushPermissions();
    this.permissionsService.addPermission(resources._id);
  }
  public updateUserData(key, value) {
    let userObject: any = this.currentUserSubject.getValue();
    // let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    userObject[key] = value;
    this.store.set('currentUser', userObject);
    localStorage.setItem('currentUser', JSON.stringify(userObject));
    this.currentUserSubject.next(userObject);
  }
  constructor(private utils: Utils, public store: StoreService, private router: Router, private http: HttpClient,
    private permissionsService: NgxPermissionsService
  ) {
    this.store.init('default');
  }
  public loggedIn() {
    if (this.currentUser) {
      return true;
    } else {
      return false;
    }
  }
  public getUserType() {
    return this.userType;
  }
  public getUserId() {
    if (this.currentUser && this.currentUser.hasOwnProperty('_id')) {
      return this.currentUser['_id'];
    } else {
      return '';
    }
  }
  public setToken(token: any) {
    this.token = token;
  }
  public getToken() {
    return this.token;
  }
  public redirectTo(uri: string) {
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() =>
      this.router.navigate([uri]));
  }
  public addLanguageToURL(url: string, lang?: string): string {
    // if (url) {
    //   let langEnd = lang;
    //   if (langEnd === undefined) {
    //       langEnd = 'en';
    //   }
    //   if (~url.indexOf('?')) {
    //     url += '&locale=' + langEnd;
    //   } else {
    //     url += '?locale=' + langEnd;
    //   }
    //   return url;
    // } else {
    //   return '';
    // }
    return url;
  }
  public getBrand() {
    let serverHostUrl = this.environmentserverHostUrl.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
    let currentHostname = (window.location.hostname).replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
    if (currentHostname !== 'localhost' && serverHostUrl !== currentHostname) {
      let remainingLink = currentHostname.replace(serverHostUrl, "");
      remainingLink = remainingLink.replace('.', "");
      return remainingLink;
    }
    return undefined;
  }
  public getDataFromList(lst: any[], idKey: string = '_id'): string[] {
    let dataList = [];
    for (let itm of lst) {
      if (itm.hasOwnProperty(idKey)) {
        dataList.push(itm[idKey]);
      }
    }
    return dataList;
  }
  public getDataFromListContains(lst: any[], val: string[], idKey: string = '_id'): any[] {
    let dataList = [];
    for (let itm of lst) {
      if (itm.hasOwnProperty(idKey) && val.includes(itm[idKey])) {
        dataList.push(itm);
      }
    }
    return dataList;
  }
  public getItemFromListContains(lst: any[], val: string, idKey: string = '_id'): any {
    for (let itm of lst) {
      if (itm.hasOwnProperty(idKey) && itm[idKey] === val) {
        return itm;
      }
    }
    return undefined;
  }
  public checkListContains(lst: any[], val: string, idKey: string = '_id'): boolean {
    for (let itm of lst) {
      if (itm.hasOwnProperty(idKey) && itm[idKey] === val) {
        return true;
      }
    }
    return false;
  }
  public logout(redirect = true, showDialog = false) {
    localStorage.removeItem('currentUser');
    // localStorage.removeItem('o');
    // localStorage.removeItem('org');
    // localStorage.removeItem('a');
    // localStorage.removeItem('l');
    localStorage.removeItem('token');
    sessionStorage.removeItem('live');
    // this.logOutApi();
    // sessionStorage.clear()
    this.appStatusSubject.next(undefined);
    this.authenticatedUser.next(false);
    this.currentUser = undefined;
    this.store.clear('default')
    this.router.navigate(['/login'])
  }
  public logOutApi() {
    if (!this.loading && this.token !== '') {
      this.loading = true;
      let urlStr = this.authURL + 'resource/user/logout/' + this.orgId;
      this.jsonGetRequest(urlStr, (jsonObj, error) => {
        if (error !== undefined) {
          // do nothing
        }
        if (jsonObj) {
          this.logout();
        }
        this.loading = false;
      });
    }
  }
  public getMe(callback: (dataResponse: any | undefined,
    requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'client/me';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          let userObject = jsonObj.results;
          callback(userObject, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, 'Data error from server ');
      }
    });
  }
  public requestLogin(username: string, password: string, callback: (dataResponse: any | undefined,
    requestError: any | undefined, returnIt: boolean) => void, lang?: string) {
    let encodedPassword = urlSafeBase64Encoding(password); // make it from backend
    let urlStr = this.authURL + 'resource/user/login?email=' + encodeURIComponent(username.trim()) + '&password=' + encodedPassword + '&vertical=' + this.orgType;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        //console.log(error);
        if (jsonObj && jsonObj.hasOwnProperty('return')) {
          callback(undefined, error, jsonObj.return);
        } else {
          callback(undefined, error, false);
        }
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          let userObject = jsonObj.results;
          if (jsonObj.hasOwnProperty('token')) {
            this.setToken(jsonObj.token);
            userObject['token'] = jsonObj.token;
          }
          callback(userObject, undefined, false);
        } else {
          if (jsonObj.hasOwnProperty('return')) {
            callback(undefined, jsonObj, jsonObj.return);
          } else {
            callback(undefined, jsonObj, false);
          }
        }
      } else {
        callback(undefined, 'Data error from server ', false);
      }
    });
  }
  public requestLoginPassCheck(username: string, callback: (dataResponse: any | undefined,
    requestError: any | undefined, returnIt: boolean) => void, lang?: string) {
    let urlStr = this.authURL + 'resource/password/required?email=' + encodeURIComponent(username.trim()) + '&vertical=' + this.orgType;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        //console.log(error);
        if (jsonObj && jsonObj.hasOwnProperty('return')) {
          callback(undefined, error, jsonObj.return);
        } else {
          callback(undefined, error, false);
        }
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          let userObject = jsonObj.results;
          if (jsonObj.hasOwnProperty('token')) {
            this.setToken(jsonObj.token);
            userObject['token'] = jsonObj.token;
          }
          callback(userObject, undefined, false);
        } else {
          if (jsonObj.hasOwnProperty('return')) {
            callback(undefined, jsonObj, jsonObj.return);
          } else {
            callback(undefined, jsonObj, false);
          }
        }
      } else {
        callback(undefined, 'Data error from server ', false);
      }
    });
  }
  public requestLoginTokenCheck(token: string, callback: (dataResponse: any | undefined,
    requestError: any | undefined, returnIt: boolean) => void, lang?: string) {
    this.token = token;
    let urlStr = this.authURL + 'client/stellar/login';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        //console.log(error);
        if (jsonObj && jsonObj.hasOwnProperty('return')) {
          callback(undefined, error, jsonObj.return);
        } else {
          callback(undefined, error, false);
        }
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          let userObject = jsonObj.results;
          if (jsonObj.hasOwnProperty('token')) {
            if (jsonObj.token) {
              this.setToken(jsonObj.token);
              this.token = jsonObj.token;
              this.store.set('token', jsonObj.token)
            }
            userObject['token'] = jsonObj.token;
          }
          callback(userObject, undefined, false);
        } else {
          if (jsonObj.hasOwnProperty('return')) {
            callback(undefined, jsonObj, jsonObj.return);
          } else {
            callback(undefined, jsonObj, false);
          }
        }
      } else {
        callback(undefined, 'Data error from server ', false);
      }
    });
  }
  public requestLoginCheck(username: string, password: string, callback: (dataResponse: any | undefined,
    requestError: any | undefined, returnIt: boolean) => void, lang?: string) {
    let encodedPassword = urlSafeBase64Encoding(password); // make it from backend
    let urlStr = this.authURL + 'resource/logged/check?email=' + encodeURIComponent(username.trim()) + '&password=' + encodedPassword + '&vertical=' + this.orgType;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        //console.log(error);
        if (jsonObj && jsonObj.hasOwnProperty('return')) {
          callback(undefined, error, jsonObj.return);
        } else {
          callback(undefined, error, false);
        }
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          let userObject = jsonObj.results;
          this.setToken(jsonObj.token);
          userObject['token'] = jsonObj.token;
          callback(userObject, undefined, false);
        } else {
          if (jsonObj.hasOwnProperty('return')) {
            callback(undefined, jsonObj.message, jsonObj.return);
          } else {
            callback(undefined, jsonObj.message, false);
          }
        }
      } else {
        callback(undefined, 'Data error from server ', false);
      }
    });
  }
  public forgotPassword(email: string, callback: (dataResponse: any | undefined,
    requestError: any | undefined, returnIt: boolean) => void, lang?: string) {
    let urlStr = this.authURL + 'client/forgotpassword?email=' + encodeURIComponent(email.trim());
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        if (error.hasOwnProperty('return')) {
          callback(undefined, error, jsonObj.return);
        } else {
          callback(undefined, error, false);
        }
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined, false);
        } else {
          if (jsonObj.hasOwnProperty('return')) {
            callback(undefined, jsonObj.message, jsonObj.return);
          } else {
            callback(undefined, jsonObj.message, false);
          }
        }
      } else {
        callback(undefined, 'Data error from server ', false);
      }
    });
  }
  public validateUser(callback: (dataResponse: any | undefined,
    requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'resource/user/valid';
    callback(true, undefined);
    // this.jsonGetRequest(urlStr, (jsonObj, error) => {
    //     if (error !== undefined) {
    //         callback(undefined, error);
    //         return;
    //     }
    //     if (jsonObj) {
    //       if (jsonObj.status) {
    //         callback(true, undefined);
    //       }else {
    //         callback(undefined, jsonObj.message);
    //       }
    //     } else {
    //       callback(undefined, 'Data error from server ');
    //     }
    // });
  }
  private toBase64(stringToSign: string) {
    let base64 = btoa(stringToSign);
    return base64;
  }
  public getMetaData(type: string, feilds: any[], callback: (dataResponse: any | undefined, requestError: any | undefined) => void, orgId?: string, lang?: string) {
    if (type.includes('orgtype') || type === 'orgtype') {
      this.getMetaDataV1(type, feilds, callback, orgId, lang)
      return;
    }
    let urlStr = this.authURL + type + '/metadata';
    let ic = '?';
    if (feilds) {
      urlStr = urlStr + ic + 'fields=' + feilds;
      ic = '&';
    }
    if (orgId) {
      urlStr = urlStr + ic + 'organizationId=' + orgId;
      ic = '&';
    }
    if (lang) {
      urlStr = urlStr + ic + 'language=' + lang;
    }
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }

  public getMetaDataV1(type: string, feilds: any[], callback: (dataResponse: any | undefined, requestError: any | undefined) => void, orgId?: string, lang?: string) {
    let urlStr = this.v1ServerUrl + type + '/metadata';
    let ic = '?';
    if (feilds) {
      urlStr = urlStr + ic + 'fields=' + feilds;
      ic = '&';
    }
    if (orgId) {
      urlStr = urlStr + ic + 'organizationId=' + orgId;
      ic = '&';
    }
    if (lang) {
      urlStr = urlStr + ic + 'language=' + lang;
    }
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }

  public saveData(type: string, data: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, useOrg: boolean = false, lang?: string) {
    if (data.hasOwnProperty('_id') && data._id) {
      let urlStr = this.authURL + type + '/' + data._id;
      if (useOrg) {
        urlStr = urlStr + '/' + this.orgId
      }
      this.jsonRequest(urlStr, (jsonObj, error) => {
        if (error !== undefined) {
          callback(undefined, 'Server Error!');
          return;
        }
        if (jsonObj) {
          if (jsonObj.status) {
            callback(jsonObj, undefined);
          } else {
            if (jsonObj.hasOwnProperty('type')) {
              this.appStatusSubject.next(jsonObj.type);
            }
            callback(undefined, jsonObj.message);
          }
        } else {
          callback(undefined, error);
        }
      }, 'POST', data);
    } else {
      let urlStr = this.authURL + type;
      // urlStr = this.addLanguageToURL(urlStr, lang);
      this.jsonRequest(urlStr, (jsonObj, error) => {
        if (error !== undefined) {
          callback(undefined, 'Server Error!');
          return;
        }
        if (jsonObj) {
          if (jsonObj.status) {
            callback(jsonObj, undefined);
          } else {
            if (jsonObj.hasOwnProperty('type')) {
              this.appStatusSubject.next(jsonObj.type);
            }
            callback(undefined, jsonObj.message);
          }
        } else {
          callback(undefined, error);
        }
      }, 'POST', data);
    }
  }
  public signUp(orgId, data: any, callback: (dataResponse: any | undefined, requestError: any | undefined, returnIt: boolean) => void, resourceType: string, lang?: string) {
    let urlStr = this.authURL + 'resource/signup/' + this.orgId + '/' + resourceType;
    // urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        //console.log(error);
        if (jsonObj && jsonObj.hasOwnProperty('return')) {
          callback(undefined, error, jsonObj.return);
        } else {
          callback(undefined, error, false);
        }
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          let userObject = jsonObj.results;
          if (jsonObj.hasOwnProperty('token')) {
            this.setToken(jsonObj.token);
            userObject['token'] = jsonObj.token;
          }
          callback(userObject, undefined, false);
        } else {
          if (jsonObj.hasOwnProperty('return')) {
            callback(undefined, jsonObj, jsonObj.return);
          } else {
            callback(undefined, jsonObj, false);
          }
        }
      } else {
        callback(undefined, 'Data error from server ', false);
      }
    }, 'POST', data);
  }
  public cropImageByOrg(data: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'img/resource/crop/' + this.orgId;
    // urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', data);
  }
  public cropImageByOrgByAny(id: string, data: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'img/resource/crop/' + this.orgId + '/' + id;
    // urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', data);
  }
  public setFavoriteData(status: boolean, type: string, favoriteId: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let assignStatus = 'assign';
    if (!status) {
      assignStatus = 'unassign';
    }
    let urlStr = this.authURL + 'favorites/' + assignStatus + '/' + this.orgId + '/' + favoriteId + '/' + type;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public getSingleData(type: string, id: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + type + '/' + id;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public getSingleCachData(type: string, id: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, cached: boolean = false, lang?: string) {
    if (cached) {
      if (this.cachedObj.hasOwnProperty(type + '/' + id)) {
        callback(this.cachedObj[type + '/' + id], undefined);
        return;
      }
    }
    let urlStr = this.authURL + type + '/' + id;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          // if (cached) {
          this.cachedObj[type] = jsonObj.results;
          // }
          callback(jsonObj.results, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public getMySingleData(type: string, id: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + type + '/' + id;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public deleteSingleData(type: string, id: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + type + '/' + id + '/delete';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST');
  }
  public deleteSingleDataByOrg(type: string, id: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + type + '/' + id + '/' + this.orgId + '/delete';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST');
  }
  public deleteSingleDataByApi(type: string, id: any, targetApi: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + type + '/' + id + '/' + targetApi;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST');
  }
  public deleteProfileImage(type: string, id: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + type + '/' + id + '/deleteprofile';
    urlStr = this.addLanguageToURL(urlStr, lang);
    let objData = {
      // folder: "string",
      url: id
    };
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', objData);
  }
  public deleteImageDataByOrg(type: string, id: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + type + '/delete/' + this.orgId;
    urlStr = this.addLanguageToURL(urlStr, lang);
    let objData = {
      // folder: "string",
      url: id
    };
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', objData);
  }
  public deleteImageDataByOrgByAny(id: string, type: string, url: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + type + '/delete/' + this.orgId + '/' + id;
    urlStr = this.addLanguageToURL(urlStr, lang);
    let objData = {
      // folder: "string",
      url: url
    };
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', objData);
  }
  public deleteBackgroundImageData(type: string, id: string, imageUrl: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'img/delete/' + id + '/tilebackground';
    let data = {
      type: type,
      imageUrl: imageUrl
    };
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', data);
  }
  public getDataListByGet(type: string, conf: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + type + '/list';
    // let urlStr = this.authURL + 'app/' + type;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public getDataListByOrgByGet(type: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + type + '/list/' + this.orgId;
    // let urlStr = this.authURL + 'app/' + type;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public getDataListByOrgByGetByAny(id: string, type: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + type + '/list/' + this.orgId + '/' + id;
    // let urlStr = this.authURL + 'app/' + type;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public getDataListBySelection(type: string, sessionId: string, conf: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, source: string = '', sourceTarget: string = '', lang?: string) {
    let cleanConf = this.buildSearchRequestSToAPI(conf, '');
    let urlStr = this.authURL + source + type + '/' + sessionId + '/tilesearch';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', cleanConf);
  }
  public getDataList(type: string, conf: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, source: string = '', sourceTarget: string = '', lang?: string) {
    if (type.includes('orgtype') || type === 'orgtype') {
      this.getDataListV1(type, conf, callback, source, sourceTarget, lang);
      return;
    }
    let cleanConf = this.buildSearchRequestSToAPI(conf, '');
    let urlStr = this.authURL + source + type + '/search' + sourceTarget;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          this.fill_id(jsonObj);
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', cleanConf);
  }

  public getDataListV1(type: string, conf: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, source: string = '', sourceTarget: string = '', lang?: string) {

    let cleanConf = this.buildSearchRequestSToAPI(conf, '');
    let urlStr = this.v1ServerUrl + source + type + '/search' + sourceTarget;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          this.fill_id(jsonObj);
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', cleanConf);
  }
  public getDataListByListByOrg(type: string, conf: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, source: string = '', sourceTarget: string = '', lang?: string) {
    let cleanConf = this.buildSearchRequestSToAPI(conf, '');
    let urlStr = this.authURL + source + type + '/list/' + this.orgId;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', cleanConf);
  }
  public getDataListByListByOrgByAny(id: string, type: string, conf: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, source: string = '', sourceTarget: string = '', lang?: string) {
    let cleanConf = this.buildSearchRequestSToAPI(conf, '');
    let urlStr = this.authURL + source + type + '/list/' + this.orgId + '/' + id;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', cleanConf);
  }
  public getDataListByList(type: string, conf: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, source: string = '', sourceTarget: string = '', lang?: string) {
    let cleanConf = this.buildSearchRequestSToAPI(conf, '');
    let urlStr = this.authURL + source + type + '/list';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', cleanConf);
  }
  public getDataListSummary(type: string, conf: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, cached: boolean = false, lang?: string) {
    let cleanConf = this.buildSearchRequestSToAPI(conf, '');
    let urlStr = this.authURL + type + '/search/summary';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          if (cached) {
            this.cachedObj[type] = jsonObj;
          }
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', cleanConf);
  }
  public getThemes(orgId: string, id: string, createdOrg: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    var urlStr = this.authURL + 'tiletheme/list';
    var query = {};

    if (this.utils.isNullOrEmpty(createdOrg)) {
      if (!this.utils.isNullOrEmpty(id)) {
        query["_id"] = id;
      } else {
        query["organizationId"] = orgId;
      }
    } else {
      query["createdOrg"] = createdOrg;
    }
    urlStr = this.addLanguageToURL(urlStr, lang);
    let lgObj = 'form_data=' + encodeURI(JSON.stringify(query));
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', lgObj);
  };
  public getDataLByOrg(type: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, cached: boolean = false, lang?: string) {
    if (cached) {
      if (this.cachedObj.hasOwnProperty(type + '/' + this.orgId)) {
        callback(this.cachedObj[type + '/' + this.orgId], undefined);
        return;
      }
    }
    // let urlStr = this.authURL  + type;
    let urlStr = this.authURL + type + '/list/' + this.orgId;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          if (cached) {
            this.cachedObj[type + '/' + this.orgId] = jsonObj;
          }
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public getDataLByOrgType(datatype: string, type: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, cached: boolean = false, lang?: string) {
    if (cached) {
      if (this.cachedObj.hasOwnProperty(datatype + '/' + this.orgId + '/' + type)) {
        callback(this.cachedObj[datatype + '/' + this.orgId + '/' + type], undefined);
        return;
      }
    }
    let urlStr = this.authURL + datatype + '/list/' + this.orgId + '/' + type;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          if (cached) {
            this.cachedObj[datatype + '/' + this.orgId + '/' + type] = jsonObj;
          }
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public getDataL(type: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, cached: boolean = false, extraId: string = '', lang?: string) {
    if (cached) {
      if (this.cachedObj.hasOwnProperty(type + '/' + extraId)) {
        callback(this.cachedObj[type + '/' + extraId], undefined);
        return;
      }
    }
    // let urlStr = this.authURL  + type;
    let urlStr = this.authURL + type + '/list';
    if (extraId) {
      urlStr = urlStr + '/' + extraId;
    }
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          if (cached) {
            this.cachedObj[type + '/' + extraId] = jsonObj;
          }
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public getUsersList(conf: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let cleanConf = this.buildSearchRequestSToAPI(conf, '');
    let urlStr = this.authURL + 'resource/user/search';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', cleanConf);
  }
  public getMyUsersList(conf: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let cleanConf = this.buildSearchRequestSToAPI(conf, '');
    let urlStr = this.authURL + 'my/resource/user/search/summary';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', cleanConf);
  }
  public getUser(userId: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'resource/user/' + userId;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public registeruser(orgId, user: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + '/resource/signup/' + orgId + '/' + environment.customKeys.roleView;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', user);
  }
  public editUser(userId: any, user: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'resource/user/' + userId;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', user);
  }
  public editUserPassword(oldpassword: any, newpassword: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + '/clients/changepassword';
    let encodedOldPassword = urlSafeBase64Encoding(oldpassword);
    let encodedNewPassword = urlSafeBase64Encoding(newpassword);
    let user = { oldpassword: encodedOldPassword, newpassword: encodedNewPassword };

    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', user);
  }
  public resetUserPassword(userId: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'resource/user/resetpassword/' + userId;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public requestPassword(useremail: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'resource/user/requestpassword/' + useremail;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public getAnswersRadonPick(sessionId: string, tileId: string, data: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'tile/answered/ramdompick/' + tileId + '/' + sessionId;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', data);
  }
  public getAnswersTileList(sessionId: string, tileId: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'tile/answer/' + tileId + '/' + sessionId;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public getAnswersTilePercentage(sessionId: string, tileId: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'tile/answerwithpercentage/' + tileId + '/' + sessionId;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public setActiveTile(sessionId: string, tileId: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'session/activate/' + sessionId + '/' + tileId + '/tile';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public deactivateTile(sessionId: string, tileId: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'session/deactivate/' + sessionId + '/' + tileId + '/tile';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public unDoneTile(sessionId: string, tileId: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'session/undone/' + sessionId + '/' + tileId + '/tile';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public getActiveTile(sessionId: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'session/get/' + sessionId + '/tile';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public setActiveLecture(roomId: string, sessionId: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'session/activate/' + sessionId + '/' + roomId + '/room';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public deactivateLecture(roomId: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'session/deactivate/' + roomId + '/room';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public getActiveLecture(roomId: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'session/room/' + roomId + '/get';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public getLectureByClass(classId: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'getLectureByClass/' + classId;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public setActiveSession(roomId: string, sessionId: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'session/activate/' + sessionId + '/' + roomId + '/room';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public deactivateSession(roomId: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'session/deactivate/' + roomId + '/room';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public getActiveSession(sessionId: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'session/' + sessionId;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public getSessionByRoom(roomId: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'getSessionByRoom/' + roomId;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public editSelfUser(userId: any, user: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'resource/user/userself/' + userId;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', user);
  }
  public assignTilesToLecture(sessionId: any, data: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'session/' + sessionId + '/assign/tile';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', data);
  }
  public assignTilesToSession(sessionId: any, data: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'session/' + sessionId + '/assign/tile';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', data);
  }
  public assignUsersToClass(classId: any, data: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'class/' + classId + '/assign';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', data);
  }
  public assignUsersToRoom(roomId: any, data: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'room/' + roomId + '/assign/owner';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', data);
  }
  public assignUsersToSession(sessionId: any, type: any, data: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'session/' + sessionId + '/assign/' + type;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', data);
  }
  public assignPresenterToSession(sessionId: any, data: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'session/' + sessionId + '/assign/presenter';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', data);
  }
  public saveDataToClass(classId: any, datatype: string, data: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + datatype + '/' + classId + '/save';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', data);
  }
  public saveDataToRoom(roomId: any, datatype: string, data: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + datatype + '/' + roomId + '/save';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', data);
  }
  public gatLectureAnswers(sessionId: string, tileId: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'tile/answer/' + sessionId + '/' + tileId;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  public getTileLink(lectureId: string = undefined, tileId: any, readOnly: boolean = true) {
    let iframeLink = environment.serverUrl + 'app/remote/tile/' + tileId + '?vertical=' + this.orgType;

    if (lectureId && this.currentUser) {
      iframeLink = environment.serverUrl + 'app/remote/tile/' + this.appId + '/' + this.currentUser._id + '/' + tileId + '/' + lectureId + '?vertical=' + this.orgType;
      if (this.currentUser.locationId && this.currentUser.locationId.length > 0) {
        iframeLink = iframeLink + '&locId=' + this.currentUser.locationId[0]._id;
      }
    }
    if (readOnly) {
      iframeLink = iframeLink + '&action=view';
    }
    return iframeLink;
  }
  private buildSearchRequestSToAPI(conf: any, token: string = '', addCustomData: boolean = true): {} {
    let searchRequestGeneric: any = {
    };
    if (conf.perpage) {
      searchRequestGeneric['count'] = conf.perpage || 10;
    }
    if (searchRequestGeneric.count === -1) {
      delete searchRequestGeneric.count;
    }
    if (conf.orderBy && conf.orderDir) {
      searchRequestGeneric['order'] = [];
      searchRequestGeneric['order'].push({ field: conf.orderBy, order: conf.orderDir });
    }
    if (conf.order) {
      searchRequestGeneric['order'] = conf.order;
    }
    let fieldList: string[] = [];
    if (conf.hasOwnProperty('fieldKeys')) {
      fieldList = conf['fieldKeys'];
    }
    if (fieldList.length > 0) {
      searchRequestGeneric['fields'] = fieldList;
    }
    if (conf.hasOwnProperty('term') && conf['term'] !== undefined) {
      searchRequestGeneric['term'] = conf['term'] || '';
    }
    if (conf.hasOwnProperty('termfields') && conf['termfields'] !== undefined) {
      searchRequestGeneric['termfields'] = conf['termfields'] || '';
    }
    let filterList = {};
    if (conf.customData && addCustomData) {
      if (Object.keys(conf.customData).length > 0) {
        for (let field of Object.keys(conf.customData)) {
          if (field)
            filterList[field] = { op: 'eq', value: conf.customData[field] };
        }
      }
    }
    if (conf.filterFieldKey) {
      for (let field of conf.filterFieldKey) {
        if (field) {
          filterList[field.field] = { op: field.op, value: field.search };
          if (field.type && field.type === 'number') {
            filterList[field.field].value = Number(filterList[field.field].value);
          }
        }
      }
    }
    if (Object.keys(filterList).length > 0) {
      searchRequestGeneric['filter'] = filterList;
    }
    if (conf.hasOwnProperty('filter')) {
      searchRequestGeneric['filter'] = conf.filter;
    }
    if (conf.hasOwnProperty('page')) {
      searchRequestGeneric['page'] = conf.page;
    }
    if (token !== '') {
      searchRequestGeneric['paginationToken'] = token;
    }
    if (conf.hasOwnProperty('include') && conf['include'] !== undefined) {
      searchRequestGeneric['include'] = conf['include'] || [];
    }
    if (conf.hasOwnProperty('exclude') && conf['exclude'] !== undefined) {
      searchRequestGeneric['exclude'] = conf['exclude'] || [];
    }
    if (conf.hasOwnProperty('organizationId') && conf['organizationId'] !== undefined) {
      searchRequestGeneric['organizationId'] = conf['organizationId'] || '';
    }
    return searchRequestGeneric;
  }
  private urlEncode(str: string): string {
    return encodeURI(str);
  }
  private jsonRequestSimple(urlString: string, callback: (json?: any, error?: any) => void, params: Dictionary, timeout: number = 60.0) {
    let body;
    if (params) {
      body = params;
    } else {
      // we need to recheck this
      //console.log('Parameters sent to jsonRequestSimple are not serializable into JSON');
    }
    this.jsonRequest(urlString, (json, error) => {
      callback(json, error);
    }, 'POST', body, ContentType.JSON, timeout);
  }
  private jsonGetRequest(urlString: string, callback: (json?: any, error?: any) => void, params?: Dictionary) {
    if (urlString) {
      let urlComps = urlString;
      if (params) {
        for (let urlItem of Object.keys(params)) {
          urlComps += '&' + urlItem + '=' + params[urlItem];
        }
      }
      this.jsonRequest(urlComps, callback, 'GET');
    } else {
      return;
    }
  }
  private jsonRequest(urlString: string,
    callback: (json: any, error: any) => void,
    method: string = 'POST',
    postBody: any = undefined,
    contentType: string = ContentType.JSON,
    timeout: number = 10.0,
    retry: boolean = false,
    retryFactor: number = 1.5,
    maxTimeout: number = 60.0, excludeVertical: boolean = false) {
    if (urlString) {
      let url: string = urlString || '';

      let headers = {
        'Accept': 'application/json',
      };

      if (contentType) {
        headers['Content-Type'] = contentType;
      }

      let t = this.store.get('token') || null;

      if (this.token || t) {
        headers['Authorization'] = t || this.token;
      }

      if (!excludeVertical)
        headers['vertical'] = this.orgType;

      let httpOptions: any = {
        responseType: 'json',
        headers: new HttpHeaders(headers),
        method: method
      }

      let bodyString = postBody;
      if (method === 'POST') {
        bodyString = JSON.stringify(postBody);
        httpOptions['body'] = bodyString;
      }
      this.http.request(method, url, httpOptions)
        // .pipe(map(
        //     (res: any) => {
        //       // below might need to be changed
        //       if (res.status >= 404) {
        //         window.location.reload();
        //       } else if (res.status >= 400) {
        //         callback(undefined, 'server');
        //         return;
        //       }
        //       return res;
        //     }
        //   ))
        .subscribe(
          (data) => {
            callback(data, undefined);
          },
          (err) => {
            console.log('here is your error', err)
            if (err) {
              if (err.status >= 404) {
                // window.location.reload();
                callback(undefined, 'Refresh page');
              } else if (err.status >= 400) {
                try {
                  // let jsonErr = err.json();
                  if (err.hasOwnProperty('type') && err.type === 'login' || err.error == "Access denied" || err.hasOwnProperty('error') && err.error.hasOwnProperty('type') && err.error.type == 'login') {
                    // this.appStatusSubject.next(jsonErr.type);
                    this.logout();
                  } else {
                    callback(undefined, 'server');
                  }
                } catch (e) {
                  callback(undefined, 'server');
                }
              } else {
                callback(undefined, err);
              }
            }
          });

    } else {
      // this.logger.log('Failed to create URL');
    }
  }
  public onUploadUserImage(browsed_file: any, userId: string): Observable<{}> {

    let headers = {
      'Authorization': this.store.get('token'),
      'Accept': 'application/json'
    };
    let httpOptions = {
      headers: new HttpHeaders(headers)
    }
    // headers.append('Authorization', 'bearer ' + this.token);
    let url = this.checkoutReqUrl + 'client/photo/upload/' + userId;
    let formData = new FormData();
    formData.append('upfile', browsed_file.originalFile);
    formData.append('name', browsed_file.text);
    return this.http.post(url,
      formData, httpOptions).pipe(map((response: any) => {
        let jsonObj = response;
        if (jsonObj) {
          if (jsonObj.status) {
            return jsonObj;
          } else {
            return { status: false, message: 'Upload Unsuccessful' };
          }
        } else {
          return { status: false, message: 'Upload Unsuccessful' };
        }
      }));
  }
  public onUploadUserTranscript(browsed_file: any, userId: string, transcript: any): Observable<{}> {
    let headers = {
      'Authorization': this.token,
      'Accept': 'application/json',
      'vertical': this.orgType
    };
    let httpOptions = {
      headers: new HttpHeaders(headers)
    }
    let url = this.authURL + 'transcript/upload/' + userId;
    let formData = new FormData();
    formData.append('upfile', browsed_file.originalFile);
    formData.append('name', browsed_file.text);
    formData.append('year', transcript.year);
    return this.http.post(url,
      formData, httpOptions).pipe(map((response: any) => {
        let jsonObj = response;
        if (jsonObj) {
          if (jsonObj.status) {
            return jsonObj;
          } else {
            return { status: false, message: 'Upload Unsuccessful' };
          }
        } else {
          return { status: false, message: 'Upload Unsuccessful' };
        }
      }));
  }
  public onUploadFiles(browsed_file: any, folder: string = '', type: string = '', isEncoded: string = 'false'): Observable<{}> {
    let headers = {
      'Authorization': this.token,
      'Accept': 'application/json',
      'vertical': this.orgType
    };
    let httpOptions = {
      headers: new HttpHeaders(headers)
    }
    let url = this.authURL + 'img/upload/' + this.orgId;
    let formData = new FormData();
    // formData.append('file', browsed_file.originalFile, browsed_file.originalFile.name);
    formData.append('upfile', browsed_file.originalFile);
    formData.append('folder', folder);
    formData.append('type', type);
    formData.append('isEncoded', isEncoded);
    return this.http.post(url,
      formData, httpOptions).pipe(map((response: any) => {
        let jsonObj = response;
        if (jsonObj) {
          if (jsonObj.status) {
            return jsonObj;
          } else {
            return { status: false, message: 'Upload Unsuccessful' };
          }
        } else {
          return { status: false, message: 'Upload Unsuccessful' };
        }
      }));
  }
  public onUploadFilesByPath(path: string, browsed_file: any): Observable<{}> {
    let headers = {
      'Authorization': this.token,
      'Accept': 'application/json',
      'vertical': this.orgType
    };
    let httpOptions = {
      headers: new HttpHeaders(headers)
    }
    let url = this.authURL + path;
    let formData = new FormData();
    // formData.append('file', browsed_file.originalFile, browsed_file.originalFile.name);
    formData.append('upfile', browsed_file.originalFile);
    formData.append('name', browsed_file.text);
    return this.http.post(url,
      formData, httpOptions).pipe(map((response: any) => {
        let jsonObj = response;
        if (jsonObj) {
          if (jsonObj.status) {
            return jsonObj;
          } else {
            return { status: false, message: 'Upload Unsuccessful' };
          }
        } else {
          return { status: false, message: 'Upload Unsuccessful' };
        }
      }));
  }
  public onUploadFilesByAny(id: string, browsed_file: any, folder: string = '', type: string = '', isEncoded: string = 'false'): Observable<{}> {
    let headers = {
      'Authorization': this.token,
      'Accept': 'application/json',
      'vertical': this.orgType
    };
    let httpOptions = {
      headers: new HttpHeaders(headers)
    }
    let url = this.authURL + 'img/resource/upload/' + this.orgId + '/' + id;
    let formData = new FormData();
    // formData.append('file', browsed_file.originalFile, browsed_file.originalFile.name);
    formData.append('upfile', browsed_file.originalFile);
    formData.append('folder', folder);
    formData.append('type', type);
    formData.append('isEncoded', isEncoded);
    return this.http.post(url,
      formData, httpOptions).pipe(map((response: any) => {
        let jsonObj = response;
        if (jsonObj) {
          if (jsonObj.status) {
            return jsonObj;
          } else {
            return { status: false, message: 'Upload Unsuccessful' };
          }
        } else {
          return { status: false, message: 'Upload Unsuccessful' };
        }
      }));
  }
  public onUploadFilesByOrg(browsed_file: any, folder: string = '', type: string = '', isEncoded: string = 'false'): Observable<{}> {
    let headers = {
      'Authorization': this.token,
      'Accept': 'application/json',
      'vertical': this.orgType
    };
    let httpOptions = {
      headers: new HttpHeaders(headers)
    }
    let url = this.authURL + 'img/resource/upload/' + this.orgId;
    let formData = new FormData();
    // formData.append('file', browsed_file.originalFile, browsed_file.originalFile.name);
    formData.append('upfile', browsed_file.originalFile);
    formData.append('folder', folder);
    formData.append('type', type);
    formData.append('isEncoded', isEncoded);
    return this.http.post(url,
      formData, httpOptions).pipe(map((response: any) => {
        let jsonObj = response;
        if (jsonObj) {
          if (jsonObj.status) {
            return jsonObj;
          } else {
            return { status: false, message: 'Upload Unsuccessful' };
          }
        } else {
          return { status: false, message: 'Upload Unsuccessful' };
        }
      }));
  }
  public onUploadBackgroundFiles(tileId: string, type: string, browsed_file: any): Observable<{}> {
    let headers = {
      'Authorization': this.token,
      'Accept': 'application/json',
      'vertical': this.orgType
    };
    let httpOptions = {
      headers: new HttpHeaders(headers)
    }
    let url = this.authURL + 'img/upload/' + tileId + '/tilebackground';
    let formData = new FormData();
    // formData.append('file', browsed_file.originalFile, browsed_file.originalFile.name);
    formData.append('upfile', browsed_file.originalFile);
    formData.append('tileId', tileId);
    formData.append('type', type);
    return this.http.post(url,
      formData, httpOptions).pipe(map((response: any) => {
        let jsonObj = response;
        if (jsonObj) {
          if (jsonObj.status) {
            return jsonObj;
          } else {
            return { status: false, message: 'Upload Unsuccessful' };
          }
        } else {
          return { status: false, message: 'Upload Unsuccessful' };
        }
      }));
  }
  public onUploadPictureByBanner(browsed_file: any): Observable<{}> {
    let headers = {
      'Authorization': this.token,
      'Accept': 'application/json',
      'vertical': this.orgType
    };
    let httpOptions = {
      headers: new HttpHeaders(headers)
    }
    let url = this.authURL + 'banner/image/upload/' + this.orgId;
    let formData = new FormData();
    formData.append('upfile', browsed_file.originalFile);
    formData.append('name', browsed_file.text);
    return this.http.post(url,
      formData, httpOptions).pipe(map((response: any) => {
        let jsonObj = response;
        if (jsonObj) {
          if (jsonObj.status) {
            return jsonObj;
          } else {
            return { status: false, message: 'Upload Unsuccessful' };
          }
        } else {
          return { status: false, message: 'Upload Unsuccessful' };
        }
      }));
  }

  public isUserRoleAdmin(): boolean {
    let user = this.currentUser;
    if (user) {
      if (user['resources'].find(role => role['_id'] === environment.customKeys.roleAdmin && role['organizationId'] === this.orgId))
        return true;
    }
    return false;
  }
  public getUserRole(): string {
    let user = this.currentUser;
    if (user) {
      if (user['resources'].find(role => role['_id'] === environment.customKeys.roleEdit && role['organizationId'] === this.orgId))
        return 'edit';
      else if (user['resources'].find(role => role['_id'] === environment.customKeys.roleView && role['organizationId'] === this.orgId))
        return 'view';
      else if (user['resources'].find(role => role['_id'] === environment.customKeys.roleAdmin && role['organizationId'] === this.orgId))
        return 'admin';
    }

    return 'anonymous';
  }
  public getUserRoleByUserData(user): string {
    if (user) {
      if (user['resources'].find(role => role['_id'] == environment.customKeys.roleEdit && role['organizationId'] === this.orgId))
        return 'edit';
      else if (user['resources'].find(role => role['_id'] == environment.customKeys.roleView && role['organizationId'] === this.orgId))
        return 'view';
      else if (user['resources'].find(role => role['_id'] == environment.customKeys.roleAdmin && role['organizationId'] === this.orgId))
        return 'admin';
    }
    return 'anonymous';
  }
  public getUserClassRole(classData: any): string {
    return 'anonymous';
  }
  public getUserRoomRole(roomData: any): string {
    if (roomData.hasOwnProperty('owner')) {
      for (let dt of roomData.owner) {
        if (this.currentUser && dt._id === this.currentUser._id) {
          return 'owner';
        }
      }
    }
    return this.getUserRole();
  }
  public getUserSessionRole(roomData: any): string {
    if (roomData.hasOwnProperty('users')) {
      for (let dt of roomData.users) {
        if (this.currentUser && dt._id === this.currentUser._id) {
          return dt.type;
        }
      }
    }
    if (this.getUserRole() === 'admin') {
      return 'admin';
    }
    return 'anonymous';
  }
  public getSessionRoleByType(sessionData: any, type): any[] {
    let userList = [];
    if (sessionData.hasOwnProperty('users')) {
      for (let dt of sessionData.users) {
        if (dt.type === type) {
          userList.push(dt);
        }
      }
    }
    return userList;
  }
  public getSessionRoleByUser(sessionData: any, userId: string): string {
    if (sessionData.hasOwnProperty('users')) {
      for (let dt of sessionData.users) {
        if (dt._id === userId) {
          return dt.type;
        }
      }
    }
    return 'anonymous';
  }
  public saveQuestion(type: string, data: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, useOrg: boolean = false, lang?: string) {
    let urlStr = this.authURL + type;
    // urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', data);
  }
  public getQuestions(type: string, sessionId: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + type + '/list/' + sessionId;
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }
  postRequest(type: string, subType: string, data: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => void) {
    let urlStr = this.authURL + type + '/' + subType;
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', data);
  }

  getSessionHost(sessionData: any): string {
    if (sessionData.hasOwnProperty('users')) {
      for (let dt of sessionData.users) {
        if (dt.host) {
          return dt._id;
        }
      }
    }
    return undefined;
  }
  public deactivateAllTiles(sessionId: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => void, lang?: string) {
    let urlStr = this.authURL + 'session/deactivateall/' + sessionId + '/tile';
    urlStr = this.addLanguageToURL(urlStr, lang);
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, error);
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    });
  }



  getLocationByGoogle(type: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => any) {
    // this.jsonRequest('https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyCXttJj9vjasr-Inv8Kn9hR5iueow40y2Y', (jsonObj, error) => {
    this.jsonRequest('https://api.ipstack.com/check?access_key=' + environment.ipStack.apiKey, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
        return;
      }
      if (jsonObj) {
        this.jsonRequest(this.authURL + 'geo/reversegeocode', (obj, error) => {
          if (error !== undefined) {
            callback(undefined, 'Server Error!');
            return;
          }
          if (obj) {
            callback(obj.results, undefined);
          }
          else {
            callback(undefined, error);
          }
          // }, 'POST', { coordinates: jsonObj.results.location.lat + ',' + jsonObj.results.location.lng });
        }, 'POST', { coordinates: jsonObj.latitude + ',' + jsonObj.longitude, resultType: type });
        // callback(jsonObj, undefined);
      }
      else
        callback(undefined, error);
    }, 'GET', undefined, null, undefined, undefined, undefined, undefined, true);
  }

  logUserSession(data: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => any) {
    this.jsonRequest(this.authURL + 'session/user', (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
        return;
      }
      if (jsonObj) {
        callback(jsonObj, undefined);
      }
      else
        callback(undefined, error);
    }, 'POST', data);
  }

  getBreakout(breakoutId: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => any) {
    this.jsonGetRequest(this.authURL + 'breakout/' + breakoutId, (obj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
        return;
      }
      if (obj) {
        callback(obj.results, undefined);
      }
      else {
        callback(undefined, error);
      }
    });
  }

  getBreakoutsPerSession(sessionId: string, type: string, callback: (dataResponse: any | undefined, requestError: any | undefined) => any) {
    let url = this.authURL + 'session/breakouts/' + sessionId;
    if (type)
      url = url + '/' + type;
    this.jsonGetRequest(url, (obj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
        return;
      }
      if (obj) {
        callback(obj.results, undefined);
      }
      else {
        callback(undefined, error);
      }
    });
  }

  deleteBreakout(data: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => any) {
    this.jsonRequest(this.authURL + 'breakout/delete', (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
        return;
      }
      if (jsonObj) {
        callback(jsonObj, undefined);
      }
      else
        callback(undefined, error);
    }, 'POST', data);
  }

  updateBreakout(data: any, callback: (dataResponse: any | undefined, requestError: any | undefined) => any) {
    this.jsonRequest(this.authURL + 'breakout/update', (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
        return;
      }
      if (jsonObj) {
        callback(jsonObj, undefined);
      }
      else
        callback(undefined, error);
    }, 'POST', data);
  }

  /*===================================================
                    CHECKOUT REQUESTS
  ====================================================*/
  public checkoutV2(checkoutObj, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'v2/checkout';
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    }, 'POST', checkoutObj);
  }
  /*===================================================
                  Item REQUESTS
  ====================================================*/
  /**
 * @description list items get request
 */
  public getItems(callback: responseCallback) {
    this.jsonGetRequest(this.checkoutReqUrl + "item/list", (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error');
      }
      if (jsonObj) {
        callback(jsonObj, undefined);
      }
      else
        callback(undefined, error);
    })
  }

  public getFilteredItems(filterObj, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'item/search';
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    }, 'POST', filterObj)
  }

  /**
   * getItem
   * @description get single item record
   */
  public getItem(id, callback: responseCallback) {
    return this.jsonGetRequest(this.checkoutReqUrl + `item/${id}`, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    })
  }




  /*===================================================
                  Invoice REQUESTS
  ====================================================*/
  /**
   * @description create invoice post request
   * @param data invoice data object
   */
  public createInvoice(data, callback: responseCallback) {
    this.jsonRequest(
      this.checkoutReqUrl + 'invoice',
      (jsonObj, error) => {
        if (error !== undefined) {
          callback(undefined, 'Server Error!');
        }

        if (jsonObj) {
          callback(jsonObj, undefined);
        }

        else
          callback(undefined, error);
      },
      'POST',
      data)
  }


  /**
   * @description get invoice by id
   * @param id id of invoice
   */
  public getInvoice(id: number | string, callback: responseCallback) {
    return this.jsonGetRequest(this.checkoutReqUrl + `invoice/${id}`, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    })
  }

  /**
 * @description get filtered invoice using filter object
 * @param filterObj filter object
 * @param callback response callback
 */
  public getFilteredInvoice(filterObj, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'invoice/search';
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    }, 'POST', filterObj)
  }

  public getInvoiceMetaData(callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'invoice/metadata';
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    })
  }

  public updateInvoice(updateObj, id, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + `invoice/${id}`;
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    }, 'POST', updateObj)
  }


  /*===================================================
                Invoice Detail REQUESTS
  ====================================================*/
  /**
   * @description create invoice items for a stored invoice
   * @param data invoice item detail object
   */
  public createInvoiceDetail(data: invoiceItem, callback: responseCallback) {
    this.jsonRequest(this.checkoutReqUrl + 'invdetails', (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    }, 'POST', data)
  }

  /**
   * @description get filtered invoice detail items using filter object
   * @param filterObj filter object
   * @param callback response callback
   */
  public getFilteredInvoiceDetail(filterObj, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'invdetails/search';
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    }, 'POST', filterObj)
  }

  public getInvoiceDetailMetaData(callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'invdetails/metadata';
    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    })
  }

  public deleteInvoice(invoiceId, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + `invoice/${invoiceId}/delete`;
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    }, 'POST')
  }



  /*===================================================
                  Client REQUESTS
  ====================================================*/

  public requestLoginClient(username: string, password: string, callback: (dataResponse: any | undefined,
    requestError: any | undefined, returnIt: boolean) => void, lang?: string) {
    let encodedPassword = urlSafeBase64Encoding(password);
    let urlStr = this.authURL + 'client/login';
    var dataBody = {
      "email": username.trim(),
      "password": encodedPassword
    }
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        if (jsonObj && jsonObj.hasOwnProperty('results')) {
          callback(undefined, error, jsonObj.results);
        } else {
          callback(undefined, error, false);
        }
        return;
      }

      if (jsonObj) {

        if (jsonObj.token) {
          this.setToken(jsonObj.token);
          this.token = jsonObj.token;
          this.store.set('token', jsonObj.token)
        }

        if (jsonObj.status) {



          let userObject = jsonObj.results;
          callback(userObject, undefined, false);
        } else {
          callback(undefined, jsonObj, false);
        }
      } else {
        callback(undefined, 'Data error from server ', false);
      }
    }, 'POST', dataBody)

  }

  public requestSignUpClient(userObj, callback: (dataResponse: any | undefined,
    requestError: any | undefined, returnIt: boolean) => void, lang?: string) {
    let email = userObj.email;
    let password = userObj.password;
    let encodedPassword = urlSafeBase64Encoding(password);
    let urlStr = this.authURL + 'client/signup';
    var dataBody = {
      "email": email.trim(),
      "password": encodedPassword,
      "active": truncate,
      "firstName": userObj.first_name,
      "lastName": userObj.last_name,
      "phone": userObj.phone,
      "discount_start": moment.utc()
    }

    if (userObj.user_type == 1) {
      dataBody["type"] = "1"
    }

    if (userObj.agent_id) {
      dataBody['agent_id'] = {
        uid: userObj.agent_id
      };
    }

    if (userObj.stripe_connect_account_id) {
      dataBody['stripe_connect_account_id'] = userObj.stripe_connect_account_id;
    }

    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        if (jsonObj && jsonObj.hasOwnProperty('return')) {
          callback(undefined, error, jsonObj.return);
        } else {
          callback(undefined, error, false);
        }
        return;
      }

      if (jsonObj) {
        if (jsonObj.status) {
          let userObject = jsonObj.results;
          if (jsonObj.hasOwnProperty('token')) {
            this.setToken(jsonObj.token);
            userObject['token'] = jsonObj.token;
          }
          callback(userObject, undefined, false);
        } else {
          if (jsonObj.hasOwnProperty('return')) {
            callback(undefined, jsonObj, jsonObj.return);
          } else {
            callback(undefined, jsonObj, false);
          }
        }
      } else {
        callback(undefined, 'Data error from server ', false);
      }
    }, 'POST', dataBody)

  }

  public requestGetClientFields(id: string, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + `client/${id}`;

    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    });
  }

  public requestGetClientByID(id: string, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + `client/${id}`;

    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    });
  }

  public requestUpdateClient(userId, userObj: UserObject, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'client/' + userId;

    if (!userId || !userObj) {
      return undefined;
    }

    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback('User Updated Successfully', undefined);
      }

      else
        callback(undefined, error);
    }, 'POST', userObj)

  }

  public fill_id(data) {
    return data.results.forEach(function (entry) {
      entry['_id'] = entry['id'];
    });
  }

  public getClientCards(id, callback: responseCallback) {
    callback({
      results: [
        {
          name: "card 1",
          id: '123klj123gh',
          last_4_digits: "9965",
          brand: "visa"
        },
        {
          name: "card 2",
          id: "1873681sdfasf9saf31s6sd",
          last_4_digits: "5563",
          brand: "Master Card"
        }
      ]
    }, undefined)
  }

  public updateClientImage(id, formData, callback) {
    if (!id || !formData) {
      callback(undefined, 'required fields');
      return;
    }

    let urlStr = this.checkoutReqUrl + `client/photo/upload/${id}`;
    let token = this.store.get('token') || this.token;
    let h = {};
    h['Accept'] = 'application/json'
    // h['Content-Type'] = 'multipart/form-data'
    h['Authorization'] = token;
    let headers = new HttpHeaders(h);
    this.http.post(urlStr, formData, { headers }).subscribe(res => {
      callback(res)
    })
  }

  public deleteClientImage(id, callback) {
    if (!id) {
      callback(undefined, 'required fields');
      return;
    }

    let urlStr = this.checkoutReqUrl + `client/photo/${id}/delete`;
    let token = this.store.get('token') || this.token;
    let h = {};
    h['Accept'] = 'application/json'
    // h['Content-Type'] = 'multipart/form-data'
    h['Authorization'] = token;
    let headers = new HttpHeaders(h);
    this.http.get(urlStr, { headers }).subscribe(res => {
      callback(res)
    })
  }

  public getFilteredClients(filterObj, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'client/search';
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    }, 'POST', filterObj)
  }

  public deleteClient(clientId, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + `client/${clientId}/delete`;
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    }, 'POST')
  }

  /*========================================================
                    SUBSCRIPTION REQUESTS
  ======================================================== */

  public createSubscription(subObj: subscriptionObject, callback: responseCallback) {

    let urlStr = this.checkoutReqUrl + 'subscription';

    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    }, 'POST', subObj);

  }

  public getSubscription(id, callback: responseCallback) {

    let urlStr = this.checkoutReqUrl + 'subscription/' + id;

    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    });

  }

  public getFilteredSubscriptions(filterObj: filterObject, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'subscription/search';
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    }, 'POST', filterObj)
  }

  public publishEvent(id: string, callback: responseCallback) {
    this.jsonGetRequest(this.checkoutReqUrl + 'subscription/publish/' + id, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }
      else {
        if (jsonObj) {
          callback(jsonObj, undefined);
        }
        else
          callback(undefined, error);
      }
    });
  }

  public updatedSubscription(id: string, updateObj: any, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'subscription/' + id;
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!')
      }

      if (jsonObj) {
        callback(jsonObj, undefined)
      }

      else
        callback(undefined, error);
    }, 'POST', updateObj)
  }
  //TODO:update subscription source
  //TODO:delete subscription
  public deleteSubscription(id: string, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'subscription/' + id;
    let updateObj = {
      deleted: true
    }
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!')
      }

      if (jsonObj) {
        callback(jsonObj, undefined)
      }

      else
        callback(undefined, error);
    }, 'POST', updateObj)
  }

  public cancelSubscription(subObj: { subscriptionId: string }, callback: responseCallback) {

    let urlStr = this.checkoutReqUrl + 'subscription/cancel';

    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    }, 'POST', subObj);

  }

  /*========================================================
                  PACKAGE REQUESTS
======================================================== */

  public requestGetPackages(callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'pkg/list';

    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);

    });
  }

  public requestCreatePackage(pckObj: packageObject, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'pkg';

    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    }, 'POST', pckObj)
  }

  public deletePackage(id, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + `pkg/${id}/delete`;

    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!')
      }

      if (jsonObj) {
        callback(jsonObj, undefined)
      }

      else
        callback(undefined, error);
    }, 'POST', {})

  }

  public updatePackage(id, updateObj, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'pkg/' + id;
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!')
      }

      if (jsonObj) {
        callback(jsonObj, undefined)
      }

      else
        callback(undefined, error);
    }, 'POST', updateObj)
  }

  public getFilteredPackages(filterObj, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'pkg/search';
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    }, 'POST', filterObj)
  }

  public getPackageDetailList(callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'pkgdetail/list';

    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);

    });
  }

  public getFilteredPackageDetails(filterObj, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'pkgdetail/search';
    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    }, 'POST', filterObj)
  }

  /*========================================================
                    CLIENT TICKET REQUESTS
  ======================================================== */

  public createTicket(ticketObj, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'ticket';

    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    }, 'POST', ticketObj)
  }


  /*========================================================
                  ORG TYPES REQUESTS
======================================================== */

  public listOrgTypes(callback: responseCallback) {

    let urlStr = this.authURL + 'eventtype/list';

    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);

    });
  }

  /*========================================================
                    AUTO LOGIN REQUESTS
  ======================================================== */

  public getStellarToken(vertical, callback) {
    let urlStr = this.v1ServerUrl + 'resource/account/login';

    let token = this.store.get('token') || this.token;

    let h = {
      "vertical": vertical,
      "Authorization": token
    }

    let headers = new HttpHeaders(h);

    this.http.get<any>(urlStr, { headers }).subscribe(data => {

      if (!data.status) {

        if (data.message && data.message == 'Not Authorised') {
          this.logout()
          return;
        }
        callback(undefined, data);
        return;
      }

      if (data.status) {
        callback(data, undefined);
        return;
      }

      callback(undefined, data);
    }, error => {
      callback(undefined, error)
    })

  }

  /*========================================================
                    PAYMENT REQUESTS
  ======================================================== */

  public createPayment(paymentObj, callback) {
    let urlStr = this.checkoutReqUrl + 'checkout';

    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    }, 'POST', paymentObj)
  }

  /*=========================================================
                        ITEM REQUESTS
  =========================================================*/
  public createItem(data, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'item';

    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    }, 'POST', data)
  }

  public updateItem(updateObj, uid, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + `item/${uid}`;

    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else {
        callback(jsonObj, error);
      }
    }, 'POST', updateObj)
  }

  public deleteItem(id, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + `item/${id}/delete`;

    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!')
      }

      if (jsonObj) {
        callback(jsonObj, undefined)
      }

      else
        callback(undefined, error);
    }, 'POST', {})

  }

  /*=========================================================
                BILLING PREFERENCES REQUESTS
  =========================================================*/

  public updateBillingPreference(clientId, updateObj, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + `client/${clientId}`;

    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else {
        callback(jsonObj, error);
      }
    }, 'POST', updateObj)
  }

  public listClientCards(callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'paymentmethod/list';

    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    })
  }

  public deleteClientCard(postObj, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'paymentmethod/delete';

    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else {
        callback(jsonObj, error);
      }
    }, 'POST', postObj)
  }

  public createClientCard(cardObj, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'paymentmethod/create';

    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else {
        callback(jsonObj, error);
      }
    }, 'POST', cardObj)
  }

  public updateClientCard(updateObj, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + `paymentmethod/update`;

    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else {
        callback(jsonObj, error);
      }
    }, 'POST', updateObj)
  }

  /*=========================================================
                          CART REQUESTS
  =========================================================*/
  public createCartItem(cartItem, callback: responseCallback) { }

  public bulkInsertCart(cart_items: any[], callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + `cart/bulkInsert`;

    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else {
        callback(jsonObj, error);
      }
    }, 'POST', { cart_items })
  }

  public getCartItems(subId, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'cart/list/' + subId;

    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    })
  }

  public sendEmail(emailBody, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'subscription/testemail';

    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else {
        callback(jsonObj, error);
      }
    }, 'POST', emailBody)
  }

  public passwordReset(body, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'client/changepassword';

    let encodedOldPassword = urlSafeBase64Encoding(body.oldpassword);
    let encodedNewPassword = urlSafeBase64Encoding(body.newpassword);
    let userData = { oldpassword: encodedOldPassword, newpassword: encodedNewPassword };

    this.jsonRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else {
        callback(jsonObj, error);
      }
    }, 'POST', userData)
  }

  public invoiceEmail(id, emailBody, callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'invoice/email/' + id;

    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else {
        callback(jsonObj, error);
      }
    })
  }

  /*========================================================
                 THEME REQUESTS
======================================================== */

  public fetchThemes(callback: responseCallback, data: any) {
    this.jsonRequest(this.authURL + 'theme/search', (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
        return;
      }
      if (jsonObj) {
        if (jsonObj.status) {
          callback(jsonObj, undefined);
        } else {
          if (jsonObj.hasOwnProperty('type')) {
            this.appStatusSubject.next(jsonObj.type);
          }
          callback(undefined, jsonObj.message);
        }
      } else {
        callback(undefined, error);
      }
    }, 'POST', data);
  }

  public getClientList(callback: responseCallback) {
    let urlStr = this.checkoutReqUrl + 'client/list';

    this.jsonGetRequest(urlStr, (jsonObj, error) => {
      if (error !== undefined) {
        callback(undefined, 'Server Error!');
      }

      if (jsonObj) {
        callback(jsonObj, undefined);
      }

      else
        callback(undefined, error);
    });
  }
}
