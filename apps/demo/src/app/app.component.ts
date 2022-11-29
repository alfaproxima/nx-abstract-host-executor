import {Component} from '@angular/core';
import {BehaviorSubject} from "rxjs";

@Component({
    selector: 'tools-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    manager = (window as any)?.Manager;

    text$ = new BehaviorSubject<string | null>(null);

    constructor() {
        window.addEventListener('get-text', (e: any) => {
            this.text$.next(e.detail);
        });
    }

    click() {
        this.manager?.getText();
    }
}
