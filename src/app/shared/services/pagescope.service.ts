import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class PageScopeService {
  public menuScopesData: any = {};
  public menuData: BehaviorSubject<any> = new BehaviorSubject<any>({});
  public menuSelectedScope: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  public isHintOn: boolean = localStorage.getItem('stellarHints') === 'true' ? true : false;

  constructor() {
  }
  init(menuItems: any[]) {
    this.getScopesData(menuItems);
    this.menuData.next(this.menuScopesData);
  }
  update(path) {
    if (this.menuScopesData.hasOwnProperty(path)) {
      this.menuSelectedScope.next(this.menuScopesData[path]);
    } else {
      this.menuSelectedScope.next([]);
    }
  }
  getScopesData(menuItems) {
    if (menuItems) {
      for (let fld of menuItems) {
        if (fld.hasOwnProperty('page')) {
          this.menuScopesData[fld.page] = fld.scopes;
        }
        if (fld.hasOwnProperty('submenu')) {
          this.getScopesData(fld.submenu);
        }
      }
    }
  }
}
