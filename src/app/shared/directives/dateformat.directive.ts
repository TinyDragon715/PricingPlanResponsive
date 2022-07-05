import { Directive, ElementRef, Input, OnInit } from '@angular/core';
import * as moment from 'moment';
@Directive({
  selector: '[appDateformat]'
})
export class DateformatDirective implements OnInit{

  @Input() public pattern: any;
  constructor(private el: ElementRef) {

   }


   ngOnInit(): void {
     
   }

   ngAfterViewInit(): void {
     this.handleFormat(this.el.nativeElement)
   }

   private handleFormat(el){
     if(el.attributes ){
       if(el.attributes.pattern){
         let a = moment(el.innerText).format(el.attributes.pattern.value)
         console.log(el.innerText)
         if(!a.includes("date")){
           el.innerText = a
         }
       }
       return
     }
     return;
   }

}
