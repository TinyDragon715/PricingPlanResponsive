import { LayoutModule } from '@angular/cdk/layout';
import { OverlayModule } from '@angular/cdk/overlay';
import { NgModule, ErrorHandler, APP_INITIALIZER } from '@angular/core';
// NGX Permissions
//import { NgxPermissionsModule } from 'ngx-permissions';
import { NgxPermissionsModule } from './shared/modules/ngx-permissions';

import { MatPaginatorIntl } from '@angular/material/paginator';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AuthGuard, LayoutService, RequestService, StoreService, LoggerService, GlobalErrorHandler, LoaderService, UserDefaultsService, PictureWallService, MatPaginationIntlService } from './shared';
import { LayoutUtilsService, MenuConfigService, SubheaderService, PageScopeService, UrlHelperService } from './shared/services';
//import { BdcWalkModule } from 'bdc-walkthrough';
import { BdcWalkModule } from './shared/modules/bdc-walkthrough';
import { SharedModule } from './shared/shared.module';
import { LayoutComponentModule } from './shared/layout.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CKEditorModule } from 'ngx-ckeditor';
import { ResizableModule } from './shared/directives/angular-resizable-element';
import { ImageCropperModule } from 'ngx-image-cropper';
import { environment } from '../environments/environment';
import { ChartService } from './shared/services/chart.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { NgIdleKeepaliveModule } from '@ng-idle/keepalive'; // this includes the core 

// AoT requires an exported function for factories
export const createTranslateLoader = (http: HttpClient) => {
  return new TranslateHttpLoader(http, './assets/vertical/' + environment.orgSubType + '/i18n/', '.json');
};

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    // NgxFlagPickerModule,
    BrowserAnimationsModule,
    LayoutModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    LayoutComponentModule,
    OverlayModule,
    HttpClientModule,
    CKEditorModule,
    ResizableModule,
    BdcWalkModule,
    ImageCropperModule,
    ClipboardModule,
    NgIdleKeepaliveModule.forRoot(),
    NgxPermissionsModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    AuthGuard,
    RequestService,
    PictureWallService,
    LayoutService,
    ChartService,
    UserDefaultsService,
    LoaderService,
    StoreService,
    LayoutUtilsService,
    MenuConfigService,
    SubheaderService,
    PageScopeService,
    UrlHelperService,
    LoggerService,
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    },
    {
      provide: MatPaginatorIntl,
      useClass: MatPaginationIntlService,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
