export class UsableContent {

    protected type: string;
    protected uid: string;
    protected name: string;
    protected time_created: any;
    protected composition: any[];

    /**
     *  @constructor
     */
    public constructor(type: string, id: string, name: string, time_created: any, composition: string[]) {
        this.type = type;
        this.uid = id;
        this.name = name;
        this.time_created = time_created;
        this.composition = composition;
    }

    /**
     *  getters and setters
     */

    public getContentType(): string {
        return 'content';
    }

    public getType(): string {
        return this.type;
    }

    public getId(): string {
        return this.uid;
    }

    public getName(): string {
        return this.name;
    }

    public getTimeCreated(): any {
        return this.time_created;
    }

    public getComposition(): any[] {
        return this.composition;
    }

    public setId(id: string) {
        this.uid = id;
    }

    public setType(type: string) {
        this.type = type;
    }

    public setName(name: string) {
        this.name = name;
    }

    public setTimeCreated(time_created: any) {
        this.time_created = time_created;
    }

    public setComposition(composition: any[]) {
        this.composition = composition;
    }
}
