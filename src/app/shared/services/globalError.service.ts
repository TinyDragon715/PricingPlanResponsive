import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable()
export class LoggerService {
  public errorObject: BehaviorSubject<any> = new BehaviorSubject<any>(undefined);
  log(error) {
    if (!environment.production)
      // console.log('My Error:', error);
      this.errorObject.next(error);
  }
}

@Injectable()
export class GlobalErrorHandler extends ErrorHandler {
  public showError: boolean = true;
  constructor(private injector: Injector, private logger: LoggerService) {
    super();
  }

  handleError(error) {
    let router = this.injector.get(Router);
    // router.navigate(['/error/400']);
    //console.log('error', error);
    if (error instanceof HttpErrorResponse) {
      //Backend returns unsuccessful response codes such as 404, 500 etc.
      console.error('Backend returned status code: ', error.status);
      console.error('Response body:', error.message);
      // router.navigate(['/error/400']);
    } else {
      //A client-side or network error occurred.
      this.logger.log(error.message);
    }
    if (this.showError) {
      this.showError = false;
      super.handleError(error);
    }
  }
}
