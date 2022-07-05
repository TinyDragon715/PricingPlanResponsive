import { Injectable } from '@angular/core';
import {environment} from '../../../environments/environment.registration';
import { HttpClient } from '@angular/common/http';
import { invoice, invoiceCreateItemResponse, invoiceCreateResponse, invoiceItem} from './interface';



@Injectable({
  providedIn: 'root'
})


export class RegFlowRequestService {

  constructor(private http: HttpClient) { }

  private reqUrl = environment.serverUrl;
  private authUrl = environment.authServerUrl;


}
