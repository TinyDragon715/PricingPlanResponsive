import { UsableContent } from './usable-content';

export class Permission extends UsableContent {
    level: number;
    parentId: number;
    isSelected:  boolean;
    title: string;
    /**
     *  @constructor
     */
    public constructor(type: string, id: string, name: string, time_created: any, composition: any[], level: number, parentId: number, isSelected:  boolean, title: string) {
        super(type, id, name, time_created, composition);
        this.level = level;
        this.parentId = parentId;
        this.isSelected = isSelected;
        this.title = title;
    }
    clear(): void {
        this.uid = undefined;
        this.name = '';
        this.level = undefined;
        this.parentId = undefined;
        this.isSelected = false;
        this.title = '';
	}
}
