import { UsableContent } from './usable-content';
import { Role } from './role.model';
import { DatePipe } from '@angular/common';
import { environment } from '../../../../environments/environment';

export class UsableUser extends UsableContent {

    public profileImageURL: any = environment.profileImageURL;
    /* event-tiles used in this event */
    private first_name: string = '';
    private last_name: string = '';
    private nationalid: string = '';
    private email: string = '';
    private phone_number: string = '';
    private website: string = '';
    private role: number = 0;
    private roles: Role[] = [];
    private userType: string;
    private updated_at: string;
    private tile_art: string = '';
    /**
     *  @constructor
     */
    public constructor(type: string, id: string, name: string, time_created: any, composition: string[], first_name: string, last_name: string, email: string, phone_number: string, role: number, userType: string, updated_at: string, roles: any[], website: string, photo: string, nationalid: string) {
        super(type, id, name, time_created, composition);
        this.first_name = first_name;
        this.last_name = last_name;
        this.nationalid = nationalid;
        this.email = email;
        this.phone_number = phone_number;
        this.website = website;
        this.role = role;
        this.userType = userType;
        this.updated_at = updated_at;
        this.tile_art = photo;
        if (roles) {
          for (let rl of roles) {
            if(rl.role){
              let newRole: Role = new Role('role', rl.role.uid, rl.role.name, rl.role.created_at, [], [], rl.role.hasusers);
              this.roles.push(newRole);
            }
          }
        }
    }

    /*
     *  getters and setters
     */
    public getFirstName(): string {
        return this.first_name;
    }
    public getLastName(): string {
        return this.last_name;
    }
    public getNationalID(): string {
        return this.nationalid;
    }
    public getEmail(): string {
        return this.email;
    }
    public getPhoneNumber(): string {
        return this.phone_number;
    }
    public getWebsite(): string {
        return this.website;
    }
    public getPhoto(): string {
        return this.tile_art;
    }
    public getPhotoPath(): string {
        return this.profileImageURL + this.tile_art;
    }
    public getRole(): number {
        return this.role;
    }
    public getUserType(): string {
        return this.userType;
    }
    public getUpdatedAt(): string {
        return this.updated_at;
    }
    public getUpdatedAtStamp(): string {
        let tempDate = new Date(this.updated_at);
        let datePipe = new DatePipe('en-US');
        let setDob = datePipe.transform(tempDate, 'yyyy-MM-ddTHH:mm');
        return setDob;
    }
    public setFirstName(first_name: string) {
        this.first_name = first_name;
    }
    public setlastName(last_name: string) {
        this.last_name = last_name;
    }
    public setNationalID(nationalID: string) {
        this.nationalid = nationalID;
    }
    public setPhoneNumber(phone_number: string) {
        this.phone_number = phone_number;
    }
    public setWebsite(website: string) {
        this.website = website;
    }
    public setPhoto(tile_art: string) {
        this.tile_art = tile_art;
    }
    public setRole(role: number) {
        this.role = role;
    }
    public setUserType(userType: string) {
        this.userType = userType;
    }
    public setUpdatedAt(updated_at: string) {
        this.updated_at = updated_at;
    }
    public getRoles(): any[] {
        return this.roles;
    }
    public hasRole(thisRole): boolean {
      for (let rl of this.roles) {
        if (rl.getId() === thisRole) {
          return true;
        }
      }
      return false;
    }
    public getDbData(): any {
      let currentProcedure = {
        name: this.getName(),
        first_name: this.getFirstName(),
        last_name: this.getLastName(),
        nationalid: this.getNationalID(),
        email: this.getEmail(),
        phone_number: this.getPhoneNumber(),
        website: this.getWebsite(),
        photo: this.getPhoto(),
      };
      if (this.getId() && this.getId() !== '') {
        currentProcedure['uid'] = this.getId();
      }
      return currentProcedure;
    }
    public getDbDataByAdmin(): any {
      let currentProcedure = {
        name: this.getName(),
        first_name: this.getFirstName(),
        last_name: this.getLastName(),
        nationalid: this.getNationalID(),
        email: this.getEmail(),
        phone_number: this.getPhoneNumber(),
        website: this.getWebsite(),
        role: this.getRole(),
        userType: this.getUserType(),
        photo: this.getPhoto()
      };
      if (this.getId() && this.getId() !== '') {
        currentProcedure['uid'] = this.getId();
      }
      return currentProcedure;
    }
}
