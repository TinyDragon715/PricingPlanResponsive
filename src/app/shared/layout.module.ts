import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SharedModule } from './shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BdcWalkModule } from './modules/bdc-walkthrough';
import { ClickOutSideDirective } from './directives';
import { Utils } from './helpers/utils';
import { CKEditorModule } from 'ngx-ckeditor';
import { ResizableModule } from './directives/angular-resizable-element';
import { ImageCropperModule } from 'ngx-image-cropper';
import { DeviceDetectorModule } from 'ngx-device-detector';
import { NgApexchartsModule } from 'ng-apexcharts';

@NgModule({
        imports: [
                CommonModule,
                RouterModule,
                SharedModule,
                TranslateModule,
                FormsModule,
                ReactiveFormsModule,
                CKEditorModule,
                BdcWalkModule,
                ResizableModule,
                ImageCropperModule,
                FlexLayoutModule.withConfig({ addFlexToParent: false }),
                DeviceDetectorModule,
                NgApexchartsModule
                // ChartsModule,
        ],
        providers: [
                // GlobalService
                Utils
        ],
        entryComponents: [
        ],
        declarations: [
                ClickOutSideDirective,
        ],
        exports: [
                ClickOutSideDirective,
        ]
})
export class LayoutComponentModule { }
