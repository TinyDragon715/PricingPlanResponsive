import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';


@Pipe({ name: 'permissionui' })
export class PermissionUIPipe implements PipeTransform {
    transform(txt, arg1) {
      if(arg1 === 'resourcetypes' && environment.customKeysView.hasOwnProperty(txt)){
        return environment.customKeysView[txt];
      }else{
        return txt;
      }
    }
}
export const permissionUIInjectables: any[] = [
  PermissionUIPipe
];
