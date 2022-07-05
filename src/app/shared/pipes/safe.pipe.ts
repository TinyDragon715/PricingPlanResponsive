import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer} from '@angular/platform-browser';

@Pipe({ name: 'safe' })
export class SafePipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) {}
    transform(url) {
      if(url)
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
      else{
        return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
      }
    }
}
export const safePipeInjectables: any[] = [
  SafePipe
];
