import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
@Injectable()
export class LayoutService {
    public appLayoutSubject: BehaviorSubject<any | undefined> = new BehaviorSubject<any | undefined>(undefined);
    public sessionData: BehaviorSubject<any | undefined> = new BehaviorSubject<any | undefined>(undefined);
    public viewMode: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>('desktop');
    public streamMode: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>('rtc');
    public data: BehaviorSubject<any | undefined> = new BehaviorSubject<any | undefined>(undefined);
    constructor(){

    }
    public cleanSettings(){
      this.appLayoutSubject = new BehaviorSubject<any | undefined>(undefined);
      this.sessionData = new BehaviorSubject<any | undefined>(undefined);
      this.viewMode = new BehaviorSubject<string | undefined>('desktop');
      this.streamMode = new BehaviorSubject<string | undefined>('rtc');
      this.data = new BehaviorSubject<any | undefined>(undefined);
    }
}
