import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { RequestService, LayoutUtilsService, StoreService } from '../../shared/services';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private requestService: RequestService,
    private layoutUtilsService: LayoutUtilsService,
    private translate: TranslateService,
    private store: StoreService) {
    store.init('default');
  }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.store.get('currentUser') && this.store.get('token')) {
      let stateName: string = state.url.replace("/", "");
      let currentUser = this.store.get('currentUser');
      if (stateName == 'dashboard' && currentUser.type == "1") {
        this.router.navigate(['/reseller/dashboard']);
      }
      return true;
    }
    this.router.navigate(['/login']);
    return false
    if (localStorage.getItem('currentUser') && localStorage.getItem('o') && localStorage.getItem('a')) {
      // logged in so return true
      let currentUser = JSON.parse(localStorage.getItem('currentUser'));
      let organizationId = JSON.parse(localStorage.getItem('o'));
      let appId = JSON.parse(localStorage.getItem('a'));
      if (this.legitUser(currentUser, organizationId, appId)) {
        return true;
      }
    }
    this.layoutUtilsService.showNotification(this.translate.instant('You have no access to the site.'), 'Dismiss');
    // not logged in so redirect to login page with the return url
    if (sessionStorage.getItem('loginEnteredIds')) {
      let loginEnteredIds = JSON.parse(sessionStorage.getItem('loginEnteredIds'));
      let orgId = loginEnteredIds.orgId;
      if (loginEnteredIds.hasOwnProperty('appId') && loginEnteredIds.hasOwnProperty('locId') && loginEnteredIds.hasOwnProperty('lang')) {
        let appId = loginEnteredIds.appId;
        let locId = loginEnteredIds.locId;
        let lang = loginEnteredIds.lang;
        this.router.navigate(['/login', orgId, appId, locId, lang], { queryParams: { returnUrl: state.url } });
      } else {
        this.router.navigate(['/login', orgId], { queryParams: { returnUrl: state.url } });
      }

    } else {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    }

    return false;
  }
  private legitUser(user, orgId, appId): boolean {
    return true
    if (user.hasOwnProperty('_id') && user.hasOwnProperty('token') && user.hasOwnProperty('organizationId') && this.requestService.checkListContains(user.organizationId, orgId) && user.hasOwnProperty('appId') && this.requestService.checkListContains(user.appId, appId)) {
      return true;
    } else {
      return false;
    }
  }
}
