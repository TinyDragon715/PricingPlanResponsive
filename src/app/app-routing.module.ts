import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './shared/guard/auth.guard';

const routes: Routes = [
    {
        path: '',
        loadChildren: () => import('./pages/pages.module').then(m => m.PagesModule)
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
    providers: [AuthGuard]
})
export class AppRoutingModule { }
