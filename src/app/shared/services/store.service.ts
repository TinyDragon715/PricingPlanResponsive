import { Injectable } from '@angular/core';

@Injectable()
export class StoreService {
    public data: any = {};
    private storeName: string;
    constructor() {
    }
    public init(storeName) {
      this.data = {};
      this.storeName = storeName;
      if (localStorage.getItem(storeName) !== undefined && localStorage.getItem(storeName) !== null) {
        this.data = JSON.parse(localStorage.getItem(storeName) || '');
      }
    }
    public set(id: any, value: any) {
      this.data[id] = value;
      this.synchronize();
    }
    public get(id: any) {
      if(this.data.hasOwnProperty(id)){
        return this.data[id];
      }else{
        return undefined;
      }
    }
    public remove(id: any) {
      // this.data.splice(this.data.indexOf(id), 1);
      delete this.data[id];
      this.synchronize();
    }
    public synchronize() {
      localStorage.setItem(this.storeName, JSON.stringify(this.data));
    }
    public clear(storeName) {
      localStorage.removeItem(storeName);
      this.data = {};
    }
}
