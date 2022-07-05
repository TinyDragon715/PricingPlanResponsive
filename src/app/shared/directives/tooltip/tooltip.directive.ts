import { Directive, Input, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
    selector: '[hint-tooltip]'
})
export class TooltipDirective {
    @Input('hint-tooltip') tooltipTitle: string;
    @Input() placement: string = "bottom";
    @Input() delay: string;
    @Input() disable: boolean = false;
    tooltip: HTMLElement;
    offset = 10;

    constructor(private el: ElementRef, private renderer: Renderer2) { }

    @HostListener('mouseenter') onMouseEnter() {
        if (!this.tooltip && !this.disable) { this.show(); }
    }

    @HostListener('mouseleave') onMouseLeave() {
        if (this.tooltip && !this.disable) { this.hide(); }
    }

    show() {
        // this.renderer.removeChild(document.body, document.querySelector('.ng-tooltip'));
        document.querySelectorAll('.ng-tooltip').forEach(element => {
            document.body.removeChild(element);
        });
        this.create();
        this.setPosition();
        this.renderer.addClass(this.tooltip, 'ng-tooltip-show');
    }

    hide() {
        this.renderer.removeClass(this.tooltip, 'ng-tooltip-show');
        window.setTimeout(() => {
            this.renderer.removeChild(document.body, this.tooltip);
            this.tooltip = null;
        }, parseInt(this.delay));
    }

    create() {
        this.tooltip = this.renderer.createElement('span');
        let element = this.renderer.createElement('div');

        element.innerHTML = this.tooltipTitle;
        this.renderer.appendChild(
            this.tooltip,
            element
        );

        this.renderer.appendChild(document.body, this.tooltip);
        // this.renderer.appendChild(this.el.nativeElement, this.tooltip);

        this.renderer.addClass(this.tooltip, 'ng-tooltip');
        this.renderer.addClass(this.tooltip, `ng-tooltip-${this.placement}`);

        // delay 설정
        this.renderer.setStyle(this.tooltip, '-webkit-transition', `opacity ${this.delay}ms`);
        this.renderer.setStyle(this.tooltip, '-moz-transition', `opacity ${this.delay}ms`);
        this.renderer.setStyle(this.tooltip, '-o-transition', `opacity ${this.delay}ms`);
        this.renderer.setStyle(this.tooltip, 'transition', `opacity ${this.delay}ms`);
    }

    setPosition() {
        const hostPos = this.el.nativeElement.getBoundingClientRect();

        const tooltipPos = this.tooltip.getBoundingClientRect();

        // window의 scroll top
        // getBoundingClientRect 메소드는 viewport에서의 상대적인 위치를 반환한다.
        // 스크롤이 발생한 경우, tooltip 요소의 top에 세로 스크롤 좌표값을 반영하여야 한다.
        const scrollPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

        let top, left;

        if (this.placement === 'top') {
            top = hostPos.top - tooltipPos.height - this.offset;
            left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
        }

        if (this.placement === 'bottom') {
            top = hostPos.bottom + this.offset;
            left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
        }

        if (this.placement === 'left') {
            top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
            left = hostPos.left - tooltipPos.width - this.offset;
        }

        if (this.placement === 'right') {
            top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
            left = hostPos.right + this.offset;
        }

        // 스크롤이 발생한 경우, tooltip 요소의 top에 세로 스크롤 좌표값을 반영하여야 한다.
        this.renderer.setStyle(this.tooltip, 'top', `${top + scrollPos}px`);
        this.renderer.setStyle(this.tooltip, 'left', `${left}px`);
    }
}
