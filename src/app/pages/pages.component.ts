import { Component, OnInit, NgZone, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { fromEvent, BehaviorSubject, merge, Subscription } from 'rxjs';
import { RequestService, LayoutUtilsService } from '../shared/services';
import { environment } from '../../environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.scss']
})
export class PagesComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  public serverName = environment.serverName;
  // public serverredirectUrl = environment.serverredirectUrl;
  public hideOuter: boolean = environment.production;
  public hideInner: boolean = true;
  public passedAvailable: boolean = false;
  private dialogRefLoggedIn: any = undefined;
  private notificationDialog: any = undefined;
  private selectedUser: any = undefined;
  private connectedToOpenTok: boolean = undefined;
  chatPrivatelyWith: any = undefined;
  showGlobalChat: boolean = true;
  _isOpenGlobalChat: boolean = false;
  // _isOpenAgenda: boolean = false;
  private timer: any;
  roomId: string = undefined;
  sessionId: string = undefined;

  // _userMap: any = undefined;
  private onLocalStorageEvent = (e) => {
    //console.log('local', e);
    var ua = navigator.userAgent.toLowerCase();
    var isSafari = false;
    if (ua.indexOf('safari') != -1) {
      if (ua.indexOf('chrome') > -1) {
        //do nothing
      } else {
        isSafari = true;
      }
    }
    if (!isSafari) {
      if (e.key == "openpages") {
        // Listen if anybody else opening the same page!
        localStorage.page_available = Date.now();
        // this.router.navigate(['/rooms/list']);
        if (isSafari) {
          setTimeout(() => {
            if (!this.passedAvailable) {
              this.alreadyLoggedIn('Logged In Elsewhere', this.serverName + ' is open in another tab. You may close this tab.', undefined, false);
              this.passedAvailable = false;
            }
          }, 1000);
        } else {
          setTimeout(() => {
            this.alreadyLoggedIn('Logged In Elsewhere', this.serverName + ' is open in another tab. You may close this tab.', undefined, false);
          }
            , 300);
        }
      }
      if (e.key == "page_available") {
        // this.router.navigate(['/rooms/list']);
        this.passedAvailable = true;
        //console.log("One more page already open");
      }
    }
  };


  constructor(private router: Router, private layoutUtilsService: LayoutUtilsService,
    private requestService: RequestService, private zone: NgZone, private translate: TranslateService, private dialog: MatDialog, private changeDetectorRef: ChangeDetectorRef, private _bottomSheet: MatBottomSheet, private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    // Broad cast that your're opening a page.
    localStorage.openpages = Date.now();
    // window.addEventListener('storage', this.onLocalStorageEvent, false); // commented becuase the reload is causing trigger for opening new page

    this.subscriptions.push(
      this.requestService.currentUserSubject.subscribe((data) => {
        if (data) {
          this.selectedUser = data;
        }
      })
    );

    this.subscriptions.push(
      this.requestService.appStatusSubject.subscribe((data: any) => {
        //console.log('appStatusSubject', data);
        if (data) {
          if (data === 'login') {
            if (sessionStorage.getItem('live')) {
              setTimeout(() => {
                this.alreadyLoggedIn('Logged In Elsewhere', 'You got logged out because you logged in from another location', 'Back to log in page');
              }, 300);
            } else {
              this.requestService.logout();
            }
          }
        }
      })
    );

    this.subscriptions.push(this.activatedRoute.params.subscribe(params => {
      if (params.hasOwnProperty('id') && params.hasOwnProperty('sessionid')) {
        if (params.hasOwnProperty('breakout')) {
          this.roomId = params['id'];
          this.sessionId = params['sessionid'];
        }
      }
    })
    );



  }

  ngOnDestroy() {

  }


  alreadyLoggedIn(title: string, msg: string, confirmText: string = undefined, throwUser: boolean = true) {
    let alertSetting = {};
    alertSetting['overlayClickToClose'] = false;
    if (confirmText) {
      alertSetting['showCloseButton'] = true;
    } else {
      alertSetting['showCloseButton'] = false;
    }

    if (!this.dialogRefLoggedIn) {
      this.dialogRefLoggedIn = this.layoutUtilsService.alertActionElement(title, msg, alertSetting, '500px');
      this.dialogRefLoggedIn.afterClosed().subscribe(res => {
        if (res) {

        }
      });
      if (throwUser) {
        this.requestService.logout(true, true);
      }
    }
  }



  detectChanges() {
    if (!this.changeDetectorRef['destroyed']) {
      this.changeDetectorRef.detectChanges();
    }
  }
}
