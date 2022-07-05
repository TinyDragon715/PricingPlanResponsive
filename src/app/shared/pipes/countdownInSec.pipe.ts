import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'countDownInSec'
})
export class CountDownInSec implements PipeTransform {
  transform(value: number): any {
    const seconds: number = Math.floor(value);
    return (
      seconds
    );
  }
}
