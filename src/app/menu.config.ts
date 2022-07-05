import { environment } from '../environments/environment.registration';
export class MenuConfig {
  public defaults: any = {
    aside: {
      self: {},
      items: [
        {
          title: "My Rooms",
          root: true,
          icon: "room_preferences",
          page: "/rooms/directory",
          bullet: "dot"
        },
        {
          title: "My Library",
          root: true,
          icon: "widgets",
          page: "/tiles",
          bullet: "dot",
          permission: [environment.customKeys.roleAdmin, environment.customKeys.roleEdit],
        },
        {
          title: "StellarConnect",
          root: true,
          icon: "recent_actors",
          page: "/book",
          bullet: "dot",
          permission: [],
        },
        {
          title: 'Broadcast',
          root: true,
          icon: "campaign",
          page: '/broadcast',
          bullet: "dot",
          permission: [environment.customKeys.roleAdmin, environment.customKeys.roleEdit]
        },
        {
          title: 'Admin',
          root: true,
          bullet: 'dot',
          icon: 'add',
          target: 'admin',
          permission: [environment.customKeys.roleAdmin],
          submenu: [
            {
              title: 'Users',
              page: '/admin/users',
            },
            {
              title: 'Rooms',
              page: '/admin/rooms'
            },
            {
              title: 'Designer',
              page: '/rooms/settings'
            },
            {
              title: 'Billboards',
              page: '/admin/billboards'
            },
            {
              title: 'Resources',
              page: '/admin/resources'
            }
          ]
        }
      ]
    }
  };

  public clientMenus: any = {
    aside: {
      self: {},
      items: [
        {
          title: 'Dashboard',
          root: true,
          icon: 'assessment',
          page: '/dashboard'
        },
        // {
        //   title: 'Items',
        //   bullet: 'dot',
        //   root: false,
        //   icon: 'amp_stories',
        //   page: '/admin/items'
        // },
        // {
        //   title: 'Packages',
        //   root: true,
        //   icon: 'extension',
        //   page: '/admin/packages'
        // },
        {
          title: 'Clients',
          root: true,
          bullet: 'dot',
          icon: 'supervisor_account',
          page: '/admin/clients'
        },
        {
          title: 'Resellers',
          root: true,
          bullet: 'dot',
          icon: 'supervisor_account',
          page: '/admin/resellers',
          permission: [environment.customKeys.roleAdmin],
        },
        // {
        //   title: 'Invoices',
        //   root: false,
        //   bullet: 'dot',
        //   icon: 'description',
        //   permissions:[],
        //   page: '/admin/invoices'
        // },
        {
          title: 'Subscriptions',
          root: true,
          icon: 'date_range',
          page: '/admin/subscriptions'
        },
      ]
    }
  };

  public get configs(): any {
    return this.defaults;
  }

  public get clientConfigs(): any{
    return this.clientMenus;
  }
}
