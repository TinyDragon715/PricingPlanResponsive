import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'countDown'
})
export class CountDown implements PipeTransform {
  constructor(private sanitized: DomSanitizer) { }
  transform(value: number): any {
    //MM:SS format
    if (value) {
      const minutes: number = Math.floor(value / 60);
      const seconds: number = Math.floor(value - minutes * 60);
      if (minutes == 0 && seconds <= 10) {
        return this.sanitized.bypassSecurityTrustHtml("<span style='color:red'>" + ("00" + minutes).slice(-2) +
          ":" +
          ("00" + seconds).slice(-2) + '</span>');
      }
      else {
        return (
          ("00" + minutes).slice(-2) +
          ":" +
          ("00" + seconds).slice(-2)
        );
        // }
        // for HH:MM:SS
        //const hours: number = Math.floor(value / 3600);
        //const minutes: number = Math.floor((value % 3600) / 60);
        //return ('00' + hours).slice(-2) + ':' + ('00' + minutes).slice(-2) + ':' + ('00' + Math.floor(value - minutes * 60)).slice(-2);
      }
    }
    return '';
  }
}
