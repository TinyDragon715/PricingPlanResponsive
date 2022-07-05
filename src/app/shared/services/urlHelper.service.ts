import { Injectable } from '@angular/core';
// import { ResponseContentType, Http, RequestOptions, Headers } from '@angular/http';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subscriber } from 'rxjs';
import { RequestService } from './request.service';

@Injectable()
export class UrlHelperService {
    constructor(private http: HttpClient,private requestService: RequestService) {
    }

    get(url: string): Observable<any> {

        let headers = {
          'http-header': this.requestService.getToken()
        };
        let httpOptions: any = {
          responseType: 'blob',
          headers: new HttpHeaders(headers)
        }
        return new Observable((observer: Subscriber<any>) => {
            let objectUrl: string = null;

            this.http
                .get(url, httpOptions)
                .subscribe(m => {
                    // objectUrl = URL.createObjectURL(m.blob());
                    objectUrl = URL.createObjectURL(m);
                    observer.next(objectUrl);
                });

            return () => {
                if (objectUrl) {
                    URL.revokeObjectURL(objectUrl);
                    objectUrl = null;
                }
            };
        });
    }
}
