import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable()
export class ChartService {
    plotThisPoint: BehaviorSubject<any> = new BehaviorSubject<any>(undefined);
}