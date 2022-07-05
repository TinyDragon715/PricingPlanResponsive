import { UsableContent } from './usable-content';

export class Role extends UsableContent {
    permissions: number[];
    hasusers: boolean = false;

    /**
     *  @constructor
     */
    public constructor(type: string, id: string, name: string, time_created: any, composition: string[], permissions: number[], hasusers: boolean) {
        super(type, id, name, time_created, composition);
        this.permissions = permissions;
        this.hasusers = hasusers;
    }
    clear(): void {
        this.uid = undefined;
        this.name = '';
        this.permissions = [];
        this.hasusers = false;
	  }
}
