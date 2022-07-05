import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
@Injectable()
export class UserDefaultsService {
    public userDefaults: any;
    public _userDefaults: BehaviorSubject<any | undefined> = new BehaviorSubject<any | undefined>(undefined);
    public static get(id){
      let userDefaults = {};
      if (sessionStorage.getItem('UserDefaults')){
        userDefaults = JSON.parse(sessionStorage.getItem('UserDefaults') || '');
      }
      return userDefaults[id];
    }
    constructor(private router: Router) {
      if (sessionStorage.getItem('UserDefaults')){
        this.userDefaults = JSON.parse(sessionStorage.getItem('UserDefaults') || '');
      }else{
        this.userDefaults = {};
      }
      // this._userDefaults.next(this.userDefaults);
    }
    public getEmptySecure(id): any{
      if (this.userDefaults.hasOwnProperty(id))
        return this.userDefaults[id];
      else{
        return '';
      }
    }
    public getEmptyBooleanSecure(id): any{
      if (this.userDefaults.hasOwnProperty(id))
        return this.userDefaults[id];
      else{
        return false;
      }
    }
    public getEmptyArraySecure(id): any[]{
      if (this.userDefaults.hasOwnProperty(id))
        return this.userDefaults[id];
      else{
        return [];
      }
    }
    public contains(id): any{
      if (this.userDefaults.hasOwnProperty(id))
        return true
      else{
        return false;
      }
    }
    public set(value: any, id: any ){
      this.userDefaults[id] = value;
    }
    public synchronize(){
      sessionStorage.setItem('UserDefaults', JSON.stringify(this.userDefaults));
    }
    public clear(){
      sessionStorage.removeItem('UserDefaults');
      this.userDefaults = {};
    }
    public next(){
      this._userDefaults.next(this.userDefaults);
    }
}
