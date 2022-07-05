import { Injectable } from '@angular/core';
import { RequestService } from './services/request.service';
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor( private authReq: RequestService) { }

}
