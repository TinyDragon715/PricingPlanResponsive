import { ModuleWithProviders, NgModule } from "@angular/core";
import { MAT_LABEL_GLOBAL_OPTIONS, MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from './modules/ngx-permissions';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgSelectModule } from '@ng-select/ng-select';


import { MatIconRegistry } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatRippleModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
// import {MatExpansionModule} from '@angular/material/expansion';
import { FormsModule as FormModule } from '@angular/forms';
import { FromNowPipe, CapitalizePipe, FirstLetterPipe, PermissionUIPipe, SafePipe, TruncatePipe, CountDown, CountDownInSec, SafeHtmlPipe } from './pipes';
import { MatBottomSheet, MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { TooltipModule } from "./directives/tooltip";

// import { NgApexchartsModule } from "ng-apexcharts";
// import { FromNowPipe } from './pipes/from-now.pipe';
// import { CapitalizePipe } from './pipes/capitalize.pipe';
// import { SafePipe } from './pipes/safe.pipe';
// import { SafePipe } from './pipes/truncate.pipe';
//
// import {DndModule} from 'ng2-dnd'.;

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // NgxFlagPickerModule
  ],
  declarations: [
    FromNowPipe,
    CapitalizePipe,
    SafePipe,
    FirstLetterPipe,
    PermissionUIPipe,
    TruncatePipe,
    SafeHtmlPipe,
    CountDown,
    CountDownInSec
    // KeysPipe
  ],
  exports: [
    FromNowPipe,
    CapitalizePipe,
    SafePipe,
    FirstLetterPipe,
    PermissionUIPipe,
    TruncatePipe,
    SafeHtmlPipe,
    CountDown,
    CountDownInSec,
    // KeysPipe
    FormModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatSidenavModule,
    TooltipModule,
    MatToolbarModule,
    MatTooltipModule,
    MatCardModule,
    MatChipsModule,
    MatTableModule,
    MatTabsModule,
    MatGridListModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatRadioModule,
    MatSelectModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatDialogModule,
    MatBottomSheetModule,
    MatProgressSpinnerModule,
    MatSortModule,
    NgxPermissionsModule,
    NgSelectModule,
    MatExpansionModule,
    MatTreeModule,
    DragDropModule,
    // NgxFlagPickerModule
    // MatMomentDateModule
  ],
  providers: [
    // { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: true } }
  ]
})
export class SharedModule { }
