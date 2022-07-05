import { Component, OnInit, Renderer2 } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { BehaviorSubject, Observable, interval, fromEvent } from 'rxjs';
import { ActivatedRoute, Router, NavigationStart, NavigationEnd, NavigationError } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { RequestService, StoreService, LoggerService, LoaderService, MenuConfigService, LayoutUtilsService } from './shared/services';
import { environment } from '../environments/environment';
import { MenuConfig } from './menu.config';
import { guid } from './shared/helpers';
import { DeviceDetectorService } from 'ngx-device-detector';
import { Idle, DEFAULT_INTERRUPTSOURCES } from '@ng-idle/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public subscriptions: any[] = <any>[];
  public aliveAppSubscriptions: any = undefined;
  public aliveCheckAppSubscriptions: any = undefined;
  public uniqueIDIdentifier: string = guid();
  public uniqueID: string = JSON.parse(JSON.stringify(this.uniqueIDIdentifier));
  public enableTranslation = environment.enableTranslation;
  public isProduction = environment.production;
  private aliveAppIntervalMinutes: number = environment.aliveAppIntervalMinutes;
  private aliveCheckAppIntervalMinutes: number = environment.aliveCheckAppIntervalMinutes;
  public showLoader: boolean = false;
  public showError: boolean = true;
  private repeatIntervalSeconds: number = environment.repeatValidateSeconds; // make less when
  private dataSeenOnce: boolean = false;
  private idleState = 'Not started.';
  private activityDialog: any = undefined;
  constructor(private menuConfigService: MenuConfigService, private meta: Meta, private title: Title, private loaderService: LoaderService, public snackBar: MatSnackBar, private translate: TranslateService, private requestService: RequestService, private logger: LoggerService, private router: Router, private dialog: MatDialog, private layoutUtilsService: LayoutUtilsService, private storeService: StoreService, private renderer: Renderer2, private deviceService: DeviceDetectorService, private idle: Idle) {
    let lang = 'en';
    if (this.enableTranslation) {
      if (localStorage.getItem('lang')) {
        lang = JSON.parse(localStorage.getItem('lang'));
      } else {
        lang = this.getBrowserLanguage();
        if (lang !== 'en' && lang !== 'fr') {
          lang = 'en';
        }
      }
    }
    translate.setDefaultLang(lang);
    this.setLanguage(lang);
    this.setIdleIntervals();
    // const isMobile = this.deviceService.isMobile();
    // const isTablet = this.deviceService.isTablet();

    // if (isMobile || isTablet) {
    //   this.router.navigate(['/mobile']);
    // }
    // else {
    this.getMe();
    // }
  }
  ngOnInit() {
    // const iliorgid = this.meta.getTag('name=ili-org-id');
    // this.title.setTitle('new title'); we can set title
    // console.log(iliorgid.content);
    this.subscriptions.push(
      this.requestService.authenticatedUser.subscribe((event: boolean) => {
        if (event) {
          let rememberMe = false;
          if (localStorage.getItem('rememberMe')) {
            rememberMe = JSON.parse(localStorage.getItem('rememberMe'));
          }
          if (!rememberMe) {
            this.resetActivity();
          } else {
            this.idle.stop();
            console.log('Idle Activity Cancelled');
          }
          // console.log('authenticatedUser' ,event);
          // console.log('this.dataSeenOnce' ,this.dataSeenOnce);
          this.dataSeenOnce = true;
          // if (!this.dataSeenOnce) {
          //   this.getMe();
          // }
        } else {
          this.idle.stop();
        }
      }
      ));
    this.subscriptions.push(interval(1000 * this.repeatIntervalSeconds).subscribe(() => {
      if (this.requestService.authenticatedUser.getValue()) {
        this.validateMe();
      }
    }));
    // const clicks$ = fromEvent(document, 'click');
    // this.subscriptions.push(
    //   clicks$.subscribe((x) => {
    //     //console.log('Calling my service here');
    //     this.subscribeActivity();
    //   })
    // );
    this.subscribeActivity();
    this.subscriptions.push(
      this.router.events.subscribe((event: any) => {
        if (event instanceof NavigationStart) {
          // Show loading indicator
          this.loaderService.display(false);
        }

        if (event instanceof NavigationEnd) {
          // Hide loading indicator
        }

        if (event instanceof NavigationError) {
          // Hide loading indicator

          // Present error to user
          // window.location.reload(); // uncomment later
          //console.log('NavigationError:', event.error);
        }
      })
    );
    this.subscriptions.push(
      this.logger.errorObject.subscribe((error) => {
        if (error) {
          if (this.showError) {
            this.showError = false;
          }
        }
      })
    );
    this.menuConfigService.loadConfigs(new MenuConfig().clientConfigs);

  }
  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
  setLanguage(lang) {
    this.translate.use(lang)
    this.requestService.lang = lang;
    localStorage.setItem('lang', JSON.stringify(lang));
  }
  getBrowserLanguage() {
    let lang = window.navigator.languages ? window.navigator.languages[0] : null;
    lang = lang || window.navigator.language;

    let shortLang = lang;
    if (shortLang.indexOf('-') !== -1)
      shortLang = shortLang.split('-')[0];

    if (shortLang.indexOf('_') !== -1)
      shortLang = shortLang.split('_')[0];

    console.log(lang, shortLang);
    return shortLang;
  }
  // subscribeActivity() {
  //   if (this.aliveAppSubscriptions) {
  //     this.aliveAppSubscriptions.unsubscribe();
  //   }
  //   if (this.aliveCheckAppSubscriptions) {
  //     this.aliveCheckAppSubscriptions.unsubscribe();
  //   }
  //   //console.log('subscribed', this.aliveCheckAppIntervalMinutes)
  //   this.aliveCheckAppSubscriptions = interval(1000 * 60 * this.aliveCheckAppIntervalMinutes).subscribe(() => {
  //     if (this.aliveAppSubscriptions) {
  //       this.aliveAppSubscriptions.unsubscribe();
  //     }
  //     if (this.aliveCheckAppSubscriptions) {
  //       this.aliveCheckAppSubscriptions.unsubscribe();
  //     }
  //     if (this.requestService.authenticatedUser.getValue()) {
  //       this.noActivity(this.translate.instant('No Activity'), this.translate.instant('There was no activity for over') + ' ' + this.aliveCheckAppIntervalMinutes + ' ' + this.translate.instant('minutes. Would you like to keep the session active?'));
  //     }
  //   });
  // };
  // noActivity(title: string, msg: string) {
  //   let alertSetting = {};
  //   alertSetting['overlayClickToClose'] = false;
  //   alertSetting['showCloseButton'] = false;
  //   alertSetting['confirmText'] = this.translate.instant('Yes');
  //   alertSetting['declineText'] = this.translate.instant('No');
  //   // alertSetting['timerEvent'] = 120;

  //   const dialogRef = this.layoutUtilsService.alertActionElement(title, msg, alertSetting);
  //   dialogRef.afterClosed().subscribe(res => {
  //     if (res) {
  //       // if(res.action === 'declineText'){
  //       //   // this.subscribeActivity(); // do nothing
  //       // }else
  //       if (res.action === 'confirmText') {
  //         dialogRef.close();
  //       } else {
  //         this.requestService.logOutApi();
  //       }
  //     }
  //   });
  //   this.aliveAppSubscriptions = interval(1000 * 60 * (this.aliveAppIntervalMinutes - this.aliveCheckAppIntervalMinutes)).subscribe(() => {
  //     if (this.aliveAppSubscriptions) {
  //       this.aliveAppSubscriptions.unsubscribe();
  //     }
  //     if (dialogRef) {
  //       dialogRef.close();
  //     }
  //     this.requestService.logOutApi();
  //   });
  // };
  noActivity(title: string, msg: string) {
    if (!this.activityDialog) {
      let alertSetting = {};
      alertSetting['overlayClickToClose'] = false;
      alertSetting['showCloseButton'] = false;
      alertSetting['confirmText'] = this.translate.instant('Ok');
      // alertSetting['declineText'] = this.translate.instant('No');
      // alertSetting['timerEvent'] = 120;

      this.activityDialog = this.layoutUtilsService.alertActionElement(title, msg, alertSetting);
      this.activityDialog.afterClosed().subscribe(res => {
        // if (res) {
        // if(res.action === 'declineText'){
        //   // this.subscribeActivity(); // do nothing
        // }else
        // if (res.action === 'confirmText') {
        //   this.activityDialog.close();
        //   this.resetActivity();
        // } else {
        //   this.requestService.logOutApi();
        // }
        // this.activityDialog = undefined;
        // }
        this.dataSeenOnce = false;
        this.activityDialog = undefined;
        this.requestService.logout();
      });
    }
  };
  public getMe() {
    // if (localStorage.getItem('currentUser') && localStorage.getItem('o') && localStorage.getItem('a') && localStorage.getItem('l')) {
    if (this.storeService.get('currentUser') && this.storeService.get('token')) {
      let currentUser = this.storeService.get('currentUser');
      let token = this.storeService.get('token');
      // let orgId = JSON.parse(localStorage.getItem('o'));
      // let appId = JSON.parse(localStorage.getItem('a'));
      // let locId = JSON.parse(localStorage.getItem('l'));
      // let orgData = JSON.parse(localStorage.getItem('org'));
      // this.requestService.orgId = orgId;
      // this.requestService.appId = appId;
      // this.requestService.locId = locId;
      // this.requestService.pageOrganization.next(orgData);
      this.requestService.setToken(token);
      this.requestService.currentUser = currentUser;
      // let resource = this.requestService.getItemFromListContains(currentUser.resources, orgId, 'organizationId');
      // this.requestService.updatePermissions(resource);
      this.dataSeenOnce = true;
      this.validateMe();
    } else {
      this.dataSeenOnce = false;
      // this.requestService.logout();
    }
  }
  public validateMe() {
    this.requestService.getMe((data, error) => {
      if (error) {
        this.requestService.logout();
        //console.log(error);
      }
      if (data) {
        sessionStorage.setItem('live', JSON.stringify(true));
        this.requestService.authenticatedUser.next(true);
        // valid
      } else {
        this.dataSeenOnce = false;
        this.requestService.logout();
      }
    });
  }
  public openAlert(message, title = 'Message') {
    const _title: string = title;
    const _description: string = message;

    const dialogRef = this.layoutUtilsService.errorElement(_title, _description);
    // dialogRef.afterClosed().subscribe(res => {
    //   if (!res) {
    //     return;
    //   }
    //   window.location.reload();
    // });
  }
  setIdleIntervals() {
    if (localStorage.getItem('idleInterval') && localStorage.getItem('timeoutInterval')) {
      this.aliveCheckAppIntervalMinutes = JSON.parse(localStorage.getItem('idleInterval'));
      this.aliveAppIntervalMinutes = JSON.parse(localStorage.getItem('timeoutInterval'));
    } else {
      localStorage.setItem('idleInterval', JSON.stringify(this.aliveCheckAppIntervalMinutes));
      localStorage.setItem('timeoutInterval', JSON.stringify(this.aliveAppIntervalMinutes))
    }
  }
  resetActivity() {
    this.idle.watch();
    this.idleState = 'Running.';
    console.log('Idle Activity', this.idleState);
  }
  subscribeActivity() {
    console.log('Idle Activity initialized');
    this.idle.setIdle(this.aliveCheckAppIntervalMinutes * 60);
    this.idle.setTimeout(this.aliveAppIntervalMinutes * 60);
    this.idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);
    this.subscriptions.push(
      this.idle.onIdleEnd.subscribe(() => {
        this.idleState = 'No longer idle.'
        console.log(this.idleState);
        this.resetActivity();
      })
    );
    this.subscriptions.push(
      this.idle.onTimeout.subscribe(() => {
        this.idleState = 'Timed out!';
        console.log(this.idleState);
        this.dataSeenOnce = false;
        this.activityDialog = undefined;
        this.requestService.logout();
      })
    );
    this.subscriptions.push(
      this.idle.onIdleStart.subscribe(() => {
        this.idleState = 'You\'ve gone idle!'
        console.log(this.idleState);
        this.noActivity(this.translate.instant('No Activity'), this.translate.instant('You have been idle for a long time. Please log in again to continue'));
      })
    );
    this.subscriptions.push(
      this.idle.onTimeoutWarning.subscribe((countdown) => {
        this.idleState = 'You will time out in ' + countdown + ' seconds!'
        console.log(this.idleState);
      })
    );
  }
}
