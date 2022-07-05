import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { userType } from '../enums';
import { StoreService } from '../services';

@Injectable({
  providedIn: 'root'
})
export class UserTypeGuard implements CanActivate {

  constructor(
    private storeService: StoreService,
    private router: Router
  ){
    this.storeService.init('default');
  }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      let data = next.data;
      let user = this.storeService.get('currentUser');
      if(user){
        if(user.type == data.type){
          //TODO: get token - validate token - get orgId - validate orgId
          return true
        }
        this.router.navigate([`/${data.redirectTo}`])
        return false;
      }
      this.router.navigate(['/login'])
      return false;
  }
  
}
