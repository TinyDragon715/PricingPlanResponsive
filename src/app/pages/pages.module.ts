import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PagesRoutingModule } from './pages-routing.module';
import { PagesComponent } from './pages.component';
import { SharedModule } from '../shared/shared.module';
import { LayoutComponentModule } from '../shared/layout.module';
@NgModule({
    imports: [
        CommonModule,
        LayoutComponentModule,
        SharedModule,
        PagesRoutingModule,
        TranslateModule
    ],
    declarations: [PagesComponent]
})
export class PagesModule { }
