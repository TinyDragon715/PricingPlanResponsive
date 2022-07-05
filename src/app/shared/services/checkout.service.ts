import { Injectable, PACKAGE_ROOT_URL } from "@angular/core";
import CheckoutConfig from "./interface/checkoutConfig.model";
import { RequestService } from "./request.service";
import * as moment from "moment";
import { environment as env } from '../../../environments/environment.registration';
import {
  itemsRef,
  packageObject,
  resourceItem,
  subscriptionObject,
} from "./interface";
import { resourcePaymentCycle, resourceType, resourceUnit } from "./enums";
import { LayoutService } from "./layout.service";
import { LayoutUtilsService } from "./utils/layout-utils.service";
import { StoreService } from "./store.service";
import { add } from "lodash";
import itemCast from '../../shared/items';

enum packageTypes { ONE_TIME = 1, MONTHLY, ANNUAL }

@Injectable({
  providedIn: "root",
})
export class CheckoutService {
  /**
   * @description hold quantities and id's for the invoice item populating
   */
  private storedInvoiceDetails: any[] = [];
  private storedInvoice: any;
  private cnf: any = {};
  private storedCnf: any = {};
  private itemDef: any = {};

  constructor(
    private request: RequestService,
    private layoutUtilService: LayoutUtilsService,
    private storeService: StoreService
  ) {
    this.init();
  }

  /**
   * @description set cnf properties used for checkout process
   */
  init() {

    this.storeService.init('default');

    this.cnf.selectedPlan = "monthly";
    this.cnf.paymentBasis = "monthly";
    this.cnf.invoiceTotal = 0;
    this.cnf.firstTotal = 0;
    this.cnf.recurringTotal = 0;
    this.cnf.monthly = [];
    this.cnf.annual = [];
    this.cnf.addOns = {
      setupFee: {
        count: 1,
        total: 0,
        price: 0,
      },
      preEventSupport: {
        total: 0,
        price: 0,
        unit: "hour",
        count: 0,
      },
      rooms: {
        count: 0,
        total: 0,
        initialTotalPrice: 0,
        initialMonthlyPrice: 0,
      },
      booths: {
        count: 0,
        total: 0,
      },
      advancedFeatures: {
        count: 0,
        total: 0,
      },
      support: {
        count: 0,
        total: 0,
      },
      liveVideoBroadcast: {
        count: 0,
        total: 0,
        price: 0,
      },
      customDesign: {
        count: 0,
        price: 0,
        total: 0,
      },
    };

    this.setItemQuantities();
  }

  /**
   * @description function returning a checkout configuration object
   */
  getCheckoutConf(): Promise<CheckoutConfig> {
    let packages = [];
    return new Promise((resolve, rej) => {
      this.request.requestGetPackages((res, err) => {
        if (res.results && res.results.length) {
          packages = res.results;

          this.request.getPackageDetailList((result, error) => {

            if (result.results && result.results.length) {
              for (let i = 0; i < packages.length; i++) {
                packages[i].items = [];
                for (let j = 0; j < result.results.length; j++) {
                  if (packages[i].uid == result.results[j].package_id.uid) {
                    packages[i].items.push(result.results[j]);
                  }
                }
              }

              packages.forEach(p => {
                if (p.type == packageTypes.MONTHLY) {
                  p.items.forEach(item => {
                    this.cnf.monthly.push(item)
                  });
                }

                if (p.type == packageTypes.ANNUAL) {
                  p.items.forEach(item => {
                    this.cnf.annual.push(item)
                  });
                }
              })
            }

            this.request.getItems((itemsRes, itemsErr) => {
              if (itemsRes !== undefined) {
                itemsRes.results.forEach((item) => {
                  if (item.type == resourceType.ROOM) {
                    this.handleRoomSegregation(item);
                    return;
                  }

                  if (item.type == resourceType.ADVANCED_ROOM) {
                    this.cnf.addOns.advancedFeatures.price = +item.price;
                    this.cnf.addOns.advancedFeatures.uid = item.uid;
                    this.cnf.addOns.advancedFeatures.monthly = true;
                    return;
                  }

                  if (item.type == resourceType.BOOTH) {
                    this.handleBoothPricing(item);
                    return;
                  }

                  if (item.type == resourceType.SUPPORT_HOURS) {
                    this.cnf.addOns.support.unit = item.unit;
                    this.cnf.addOns.support.price = +item.price;
                    this.cnf.addOns.support.uid = item.uid;
                    return;
                  }

                  if (item.type == resourceType.VIEWER_HOURS) {
                    this.cnf.addOns.liveVideoBroadcast.price = +item.price;
                    this.cnf.addOns.liveVideoBroadcast.unit = item.unit;
                    this.cnf.addOns.liveVideoBroadcast.uid = item.uid;
                    return;
                  }

                  if (item.type == resourceType.SETUP) {
                    this.cnf.addOns.setupFee.price = +item.price;
                    this.cnf.addOns.setupFee.unit = item.unit;
                    this.cnf.addOns.setupFee.uid = item.uid;
                    this.cnf.addOns.setupFee.count = 1;
                    this.cnf.addOns.setupFee.total = +item.price * this.cnf.addOns.setupFee.count
                    return;
                  }

                  if (item.type == resourceType.DESIGN) {
                    this.cnf.addOns.customDesign.price = +item.price;
                    this.cnf.addOns.customDesign.unit = item.unit;
                    this.cnf.addOns.customDesign.uid = item.uid;
                    return;
                  }

                  if (item.type == resourceType.PRE_EVENT_SUPPORT) {
                    this.cnf.addOns.preEventSupport.price = +item.price;
                    this.cnf.addOns.preEventSupport.unit = item.unit;
                    this.cnf.addOns.preEventSupport.uid = item.uid;
                  }
                });
                resolve(this.cnf);
              }
            });
          });
        }
      });
    });
  }

  /**
   * @description function to set a checkout configuration object
   * @param {CheckoutConfig} data
   */
  setCheckoutConf(data) {
    this.storedCnf = data;
    this.setItemQuantities();
  }

  /**
   * @description gets the selected options for checkout conf
   */
  getStoredConf(): CheckoutConfig {
    return this.storedCnf;
  }

  /**
   * @description reset the the cnf property to it's initial values
   */
  resetConf() { }

  /**
   * @description use room data retrieved from the server to fill the cnf object
   * @param data
   */
  private handleRoomSegregation(data) {
    this.cnf.addOns.rooms.initialTotalPrice = 0;
    this.cnf.addOns.rooms.unit = data.unit;
    this.cnf.addOns.rooms.monthly = true;


    if (data.name.includes("15") && +data.payment_cycle == resourcePaymentCycle.ONE_TIME) {
      this.cnf.addOns.rooms.initialCount = 15;
      this.cnf.addOns.rooms.initialMonthlyPrice = +data.price;
      this.cnf.addOns.rooms.initialMonthlyId = data.uid;
      this.cnf.addOns.rooms.initialTotalPrice = +data.price;
      return;
    }

    if (data.name.includes("15")) {
      this.cnf.addOns.rooms.initialCount = 15;
      this.cnf.addOns.rooms.initialPrice = +data.price;
      this.cnf.addOns.rooms.initialId = data.uid;
      this.cnf.addOns.rooms.initialTotalPrice = +data.price;
      return
    }

    if (data.payment_cycle == "2") {
      this.cnf.addOns.rooms.monthlyPrice = +data.price;
      this.cnf.addOns.rooms.monthlyId = data.uid;
      return;
    }


    this.cnf.addOns.rooms.price = +data.price;
    this.cnf.addOns.rooms.count = 0;
    this.cnf.addOns.rooms.uid = data.uid;

    // return;
  }

  /**
   * @description use room data retrieved from the server to fill the cnf object
   * @param data
   */
  private handleBoothPricing(data) {
    this.cnf.addOns.booths.count = 0;
    this.cnf.addOns.booths.initialCount = 0;
    this.cnf.addOns.booths.unit = data.unit;

    if (data.payment_cycle == resourcePaymentCycle.MONTHLY) {
      this.cnf.addOns.booths.monthlyPrice = +data.price;
      this.cnf.addOns.booths.monthlyId = data.uid;
      this.cnf.addOns.booths.monthly = true;
      return;
    }

    this.cnf.addOns.booths.uid = data.uid;
    this.cnf.addOns.booths.price = +data.price;
  }

  /**
   * @description populate the items ref variable based on the stored cnf for creation of invoice items
   */
  public setItemQuantities(): void {
    this.storedInvoiceDetails = [];
    let isMonthly = this.storedCnf.paymentBasis == "monthly" ? true : false;
    for (let key in this.storedCnf.addOns) {
      let item = this.storedCnf.addOns[key];
      let monthly = false;
      if (key == 'rooms' || key == 'booths' || key == 'advancedFeatures') {
        monthly = true;
      }

      if (isMonthly && item.initialMonthlyId) {
        this.storedInvoiceDetails.push({
          uid: item.initialMonthlyId,
          quantity: 1,
          price: item.initialMonthlyPrice,
          monthly
        });
      }

      if (!isMonthly && item.initialId) {
        this.storedInvoiceDetails.push({
          uid: item.initialId,
          quantity: 1,
          price: item.initialPrice,
          monthly
        });
      }

      if (item.uid || item.monthlyId) {
        if (isMonthly && item.monthlyPrice && item.monthlyId) {
          this.storedInvoiceDetails.push({
            uid: item.monthlyId,
            quantity: item.count,
            price: item.monthlyPrice,
            monthly
          });
        } else {
          this.storedInvoiceDetails.push({
            uid: item.uid,
            quantity: item.count,
            price: item.price,
            monthly
          });
        }
      }
    }
  }

  /**
   * @description create invoice and store it in currentInvoice public property
   */
  public createInvoice(data, checkoutObj = null, callback = null) {
    this.request.createInvoice(data, (res, err) => {

      if (err != undefined) {
        if (callback) {
          callback(undefined, true);
        }
        return;
      }

      if (res !== undefined) {
        this.storedInvoice = res.results;
        this.storeService.set('currentInvoiceId', res.results.uid.toString())

        if (checkoutObj) {
          checkoutObj['invoiceId'] = res.results.uid.toString();
          checkoutObj['subscriptionId'] = checkoutObj["subscriptionId"].toString();

          if (callback) {
            this.createPayment(checkoutObj, callback);
            return;
          }

          this.createPayment(checkoutObj);

        }


        if (callback) {
          callback(true, undefined);
        }
        return;
      }

      if (callback) {
        callback(undefined, true);
      }
    });
  }

  public createPayment(data, callback = null) {

    if (data.subStartDate) {
      data['subStartDate'] = moment().add(1, 'month').unix()
    }
    this.request.createPayment(data, (res, err) => {

      if (err != undefined) {
        if (callback) {
          callback(undefined, true)
        }

        return;
      }

      if (res && res.status) {
        if (callback) {
          callback(true, undefined, true);
        }

        return;
      }


      if (callback) {
        callback(undefined, true)
      }

    })
  }

  /**
   * @description get stored invoice
   */
  public getStoredInvoice() {
    return this.storedInvoice;
  }

  /**
   * @description add items to specific invoice
   * @param invoiceId stored invoice id
   */
  public addInvoiceDetail(invoiceId) {
    this.storedInvoiceDetails.forEach((item) => {
      if (item.quantity < 1) {
        return
      }
      this.request.createInvoiceDetail(
        {
          item_id: {
            uid: item.uid.toString(),
          },
          unit_price: item.price,
          total: item.price * item.quantity,
          quantity: item.quantity,
          invoice_id: {
            uid: invoiceId.toString(),
          },
          expiry_date: item.monthly && this.storedCnf.paymentBasis == 'yearly' ? moment(new Date()).add(1, 'year').format("YYYY-MM-DD HH:mm:ss") : moment(new Date()).add(1, 'month').format("YYYY-MM-DD HH:mm:ss"),
          start_date: moment(new Date()).add(1, "month").format("YYYY-MM-DD HH:mm:ss"),
        },
        (res, err) => {
          if (res !== undefined) {
          }
        }
      );
    });
  }

  /**
   * @description returns a user object or undefined if 
   * the user is not stored in localStorage
   */
  public getCurrentUser() {
    let user = this.storeService.get('currentUser');
    if (user) {
      return user;
    }
    return undefined;
  }

  public createSubscription(invoiceDataObj, checkoutObj = null, status = null, callback = null) {

    let items = [];


    for (let i = 0; i < this.storedInvoiceDetails.length; i++) {
      let item = this.storedInvoiceDetails[i];

      if (item.quantity > 0) {
        if (item.quantity > 999) {
          item.quantity = item.quantity / 1000
        }
        items.push({
          item_id: {
            uid: item.uid.toString(),
          },
          unit_price: item.price,
          total: item.hasOwnProperty('monthly') && item.monthly && this.storedCnf.paymentBasis == 'yearly' ? (item.price * item.quantity) * 12 : item.price * item.quantity,
          quantity: item.quantity,
          start_date: moment(new Date()).add(1, 'month').format("YYYY-MM-DD HH:mm:ss"),
          expiry_date: item.monthly && this.storedCnf.paymentBasis == 'yearly' ? moment(new Date()).add(1, 'year').format("YYYY-MM-DD HH:mm:ss") : moment(new Date()).add(1, 'month').format("YYYY-MM-DD HH:mm:ss"),
        })
      }

    }

    let sub = this.storeService.get('currentSubscription');

    invoiceDataObj.invoice_details = items;
    invoiceDataObj.status = '2';

    if (status) {
      invoiceDataObj.status = status;
    }

    //create subscription update object
    let subUpdateObj = this.createSubscriptionUpdateObj(checkoutObj)

    this.request.updatedSubscription(sub.uid, subUpdateObj,
      (res, err) => {

        if (err != undefined) {
          if (callback) {
            callback(undefined, true);
          }
          return;
        }

        if (res && res.status) {
          this.storeSubscription(res.results);

          if (checkoutObj) {
            checkoutObj.firstTimeAmount = this.storedCnf.recurringTotal * 100;
            checkoutObj.subscription = this.storedCnf.firstTotal * 100;
            checkoutObj.nextCycleAmount = this.storedCnf.firstTotal * 100;
            checkoutObj.onetime = (this.storedCnf.recurringTotal - this.storedCnf.firstTotal) * 100;
            checkoutObj.subscriptionId = res.results.uid;
          }

          console.log('new amounts', this.storedCnf.recurringTotal, this.storedCnf.firstTotal)

          invoiceDataObj.subscription_details_id.uid = res.results.uid.toString();

          if (callback) {
            this.createInvoice(invoiceDataObj, checkoutObj, callback);
            return;
          }
          this.createInvoice(invoiceDataObj, checkoutObj);



          this.layoutUtilService.showNotificationSnack(
            "Subscription Created",
            "dismiss"
          );
          return;
        }

        if (callback) {
          callback(undefined, true);
        }
        this.layoutUtilService.showNotificationSnack(
          "Error Creating Subscription",
          "dismiss"
        );
      })
  }

  public checkout(checkoutObj = null, status = null, callback = null) {
    if (checkoutObj) {
      checkoutObj.onetime = (this.storedCnf.firstTotal - this.storedCnf.recurringTotal) * 100;
      checkoutObj.subscription = this.storedCnf.recurringTotal * 100;
      checkoutObj.subscriptionId = checkoutObj.subscriptionUID;
      checkoutObj.invoiceId = checkoutObj.InvoiceUID;
      if (callback) {
        this.createPayment(checkoutObj, callback);
        return;
      }
      this.createPayment(checkoutObj);
    }
    this.layoutUtilService.showNotificationSnack(
      "Subscription Created",
      "dismiss"
    );
    return;
  }

  public createSubscriptionUpdateObj(checkoutObj) {
    let sub = this.storeService.get('currentSubscription')
    let editSub = this.storeService.get('subEdit');
    let { addOns } = this.storedCnf;
    let stat_std_rooms = addOns ? (addOns.rooms.count + addOns.rooms.initialCount) : sub.stat_std_rooms || 0
    let stat_adv_rooms = addOns ? addOns.advancedFeatures.count : sub.stat_adv_rooms || 0
    let stat_booths = addOns ? addOns.booths.count : sub.stat_booths || 0
    let stat_viewer_hrs = addOns ? addOns.liveVideoBroadcast.count : sub.stat_viewer_hrs || 0
    let stat_support_hrs = addOns ? addOns.support.count : sub.stat_support_hrs || 0;
    let stat_designs = addOns ? addOns.customDesign.count : sub.stat_design || 0;
    let stat_preevent_support_hours = addOns ? +addOns.preEventSupport.count : +sub.stat_preevent_support_hours || 0;

    if (editSub) {
      return {
        payment_cycle: this.cnf.paymentBasis == 'monthly' ? "1" : "2",
        start_date: checkoutObj && checkoutObj.hasOwnProperty('subStartDate') ? moment(new Date()).add(1, 'months').format("YYYY-MM-DD HH:mm:ss") : sub.start_date,
        package_id: {
          uid: this.cnf.paymentBasis == 'monthly' ? env.PACKAGE.MONTHLY : env.PACKAGE.YEARLY
        },
        end_date: this.storedCnf.paymentBasis == 'yearly' ?
          moment(new Date()).add(1, 'year').format("YYYY-MM-DD HH:mm:ss") :
          (checkoutObj && checkoutObj.hasOwnProperty('subStartDate') ?
            moment(new Date()).add(2, 'months').format("YYYY-MM-DD HH:mm:ss") :
            moment(new Date()).add(1, 'months').format("YYYY-MM-DD HH:mm:ss"))
      }
    }
    return {
      payment_cycle: this.cnf.paymentBasis == 'monthly' ? "1" : "2",
      start_date: checkoutObj && checkoutObj.hasOwnProperty('subStartDate') ? moment(new Date()).add(1, 'months').format("YYYY-MM-DD HH:mm:ss") : sub.start_date,
      package_id: {
        uid: this.cnf.paymentBasis == 'monthly' ? env.PACKAGE.MONTHLY : env.PACKAGE.YEARLY
      },
      end_date: this.storedCnf.paymentBasis == 'yearly' ?
        moment(new Date()).add(1, 'year').format("YYYY-MM-DD HH:mm:ss") :
        (checkoutObj && checkoutObj.hasOwnProperty('subStartDate') ?
          moment(new Date()).add(2, 'months').format("YYYY-MM-DD HH:mm:ss") :
          moment(new Date()).add(1, 'months').format("YYYY-MM-DD HH:mm:ss")),
      stat_std_rooms,
      stat_adv_rooms,
      stat_booths,
      stat_viewer_hrs,
      stat_support_hrs,
      stat_designs,
      stat_preevent_support_hours
    }
  }
  public UpdateSubscriptionUpdateObj(checkoutObj) {
    let sub = this.storeService.get('currentSubscription')
    let editSub = this.storeService.get('subEdit');
    let { addOns } = this.storedCnf;
    let stat_std_rooms = addOns ? (addOns.rooms.count) : (sub.stat_std_rooms + sub.stat_adv_rooms) || 0
    let stat_adv_rooms = addOns ? addOns.advancedFeatures.count : sub.stat_adv_rooms || 0
    let stat_booths = addOns ? addOns.booths.count : sub.stat_booths || 0
    let stat_viewer_hrs = addOns ? addOns.liveVideoBroadcast.count : sub.stat_viewer_hrs || 0
    let stat_support_hrs = addOns ? addOns.support.count : sub.stat_support_hrs || 0;
    let stat_designs = addOns ? addOns.customDesign.count : sub.stat_design || 0;
    let stat_preevent_support_hours = addOns ? +addOns.preEventSupport.count : +sub.stat_preevent_support_hours || 0;

    if (editSub) {
      return {
        start_date: checkoutObj && checkoutObj.hasOwnProperty('subStartDate') ? moment(new Date()).add(1, 'months').format("YYYY-MM-DD HH:mm:ss") : sub.start_date,
        package_id: {
          uid: this.cnf.paymentBasis == 'monthly' ? env.PACKAGE.MONTHLY : env.PACKAGE.YEARLY
        },
        end_date: this.storedCnf.paymentBasis == 'yearly' ?
          moment(new Date()).add(1, 'year').format("YYYY-MM-DD HH:mm:ss") :
          (checkoutObj && checkoutObj.hasOwnProperty('subStartDate') ?
            moment(new Date()).add(2, 'months').format("YYYY-MM-DD HH:mm:ss") :
            moment(new Date()).add(1, 'months').format("YYYY-MM-DD HH:mm:ss"))
      }
    }
    return {
      start_date: checkoutObj && checkoutObj.hasOwnProperty('subStartDate') ? moment(new Date()).add(1, 'months').format("YYYY-MM-DD HH:mm:ss") : sub.start_date,
      package_id: {
        uid: this.cnf.paymentBasis == 'monthly' ? env.PACKAGE.MONTHLY : env.PACKAGE.YEARLY
      },
      end_date: this.storedCnf.paymentBasis == 'yearly' ?
        moment(new Date()).add(1, 'year').format("YYYY-MM-DD HH:mm:ss") :
        (checkoutObj && checkoutObj.hasOwnProperty('subStartDate') ?
          moment(new Date()).add(2, 'months').format("YYYY-MM-DD HH:mm:ss") :
          moment(new Date()).add(1, 'months').format("YYYY-MM-DD HH:mm:ss")),
      stat_std_rooms,
      stat_adv_rooms,
      stat_booths,
      stat_viewer_hrs,
      stat_support_hrs,
      stat_designs,
      stat_preevent_support_hours
    }
  }

  private storeSubscription(obj) {
    this.storeService.set("currentSubscription", obj);
  }

  public getStoredSubscription() {
    return this.storeService.get('currentSubscription')
  }

  public createPackage() {
    let pkgObj: packageObject = {
      name: "",
      type: "1",
      price: 0,
    };
    this.request.requestCreatePackage(pkgObj, (res, err) => {
      console.log(err);
    });
  }

  public updateClientInformation(updateObj) {
    let user: any = this.getCurrentUser();
    this.request.requestUpdateClient(user.uid, updateObj, (res, err) => {
      if (err) {
        this.layoutUtilService.errorElement(
          "update User",
          "Failed to update your information please try again"
        );
      }
    });
  }

  //create subscription for template
  public createTemplate(evenType = 7) {

    return new Promise((resolve, reject) => {

      this.getCheckoutConf().then(checkoutCnf => {
        //set stored cnf 
        this.storedCnf = this.cnf;

        this.storedCnf.paymentBasis = 'yearly';
        this.storedCnf.invoiceTotal = 0;
        //set stored cnf item quantities to 1 each
        for (let key in this.storedCnf.addOns) {
          this.storedCnf.addOns[key].count = 1;
          this.storedCnf.addOns[key].total = +this.storedCnf.addOns[key].price * +this.storedCnf.addOns[key].count
          this.storedCnf.invoiceTotal += this.storedCnf.addOns[key].total;
        }

        this.setItemQuantities();


        let client = this.storeService.get('currentUser').uid + "";
        let type = 'template';
        let sub: any = {
          client_id: {
            id: client
          },
          user_id: {
            id: client
          },
          organization_id: {
            name: 'my template'
          },
          //TODO: get dynamically
          package_id: {
            uid: env.PACKAGE.YEARLY
          },
          organization_type: 'conference',
          event_type: evenType
        }

        this.request.createSubscription(sub, (res, err) => {
          if (err != undefined) {
            this.layoutUtilService.showNotification('Server Error', 'Dismiss');
            return;
          }

          this.storeService.set('currentSubscription', res.results);

          this.createSubscriptionV2({
            issue_date: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
            sub_total: this.storedCnf.invoiceTotal,
            discount: 0,
            total: this.storedCnf.invoiceTotal,
            stripe_payment_id: "sd",
            payment_date: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
            subscription_details_id: {
              uid: "1",
            },
            stellar_id: "s",
            notes: ""
          }).then(success => {
            resolve(true)
          }).catch(err => {
            reject(false)
          })

        })



      })
    })
    //get the items

  }

  private createSubscriptionV2(invoiceDataObj, checkoutObj = null) {
    return new Promise((resolve, reject) => {
      let user: { uid: string; } = this.getCurrentUser();

      let items = [];

      this.storedInvoiceDetails.forEach(item => {
        if (item.quantity < 1) {
          return
        }
        if (item.quantity > 999) {
          item.quantity = item.quantity / 1000
        }
        items.push({
          item_id: {
            uid: item.uid.toString(),
          },
          unit_price: item.price,
          total: item.hasOwnProperty('monthly') && item.monthly && this.storedCnf.paymentBasis == 'yearly' ? (item.price * item.quantity) * 12 : item.price * item.quantity,
          quantity: item.quantity,
          expiry_date: item.monthly && this.storedCnf.paymentBasis == 'yearly' ? moment(new Date()).add(1, 'year').format("YYYY-MM-DD HH:mm:ss") : moment(new Date()).add(1, 'month').format("YYYY-MM-DD HH:mm:ss"),
          start_date: moment(new Date()).add(1, "month").format("YYYY-MM-DD HH:mm:ss"),
        })
      })

      let sub = this.storeService.get('currentSubscription');

      invoiceDataObj.invoice_details = items

      this.request.updatedSubscription(sub.uid, {
        package_id: {
          uid: this.cnf.paymentBasis == 'monthly' ? env.PACKAGE.MONTHLY : env.PACKAGE.YEARLY
        }
      },
        (res, err) => {
          if (res && res.status) {
            resolve(true);
            this.storeSubscription(res.results);

            if (checkoutObj) {
              checkoutObj.subscription = res.results.uid;
              checkoutObj.firstTimeAmount = this.storedCnf.firstTotal
              checkoutObj.nextCycleAmount = this.storedCnf.recurringTotal
              checkoutObj.subscriptionId = res.results.uid;
            }

            invoiceDataObj.subscription_details_id.uid = res.results.uid.toString();
            this.layoutUtilService.showNotificationSnack(
              "Subscription Created",
              "dismiss"
            );
            return;
          }

          reject(false)

          this.layoutUtilService.showNotificationSnack(
            "Error Creating Subscription",
            "dismiss"
          );
        })
    })

  }

  public getCountryList() {
    return {
      af: 'Afghanistan',
      al: 'Albania',
      dz: 'Algeria',
      as: 'American Samoa',
      ad: 'Andorra',
      ao: 'Angola',
      ai: 'Anguilla',
      aq: 'Antarctica',
      ag: 'Antigua and Barbuda',
      ar: 'Argentina',
      am: 'Armenia',
      aw: 'Aruba',
      au: 'Australia',
      at: 'Austria',
      az: 'Azerbaijan',
      bs: 'Bahamas',
      bh: 'Bahrain',
      bd: 'Bangladesh',
      bb: 'Barbados',
      by: 'Belarus',
      be: 'Belgium',
      bz: 'Belize',
      bj: 'Benin',
      bm: 'Bermuda',
      bt: 'Bhutan',
      bo: 'Bolivia',
      bq: 'Bonaire',
      ba: 'Bosnia',
      bw: 'Botswana',
      bv: 'Bouvet Island',
      br: 'Brazil',
      io: 'British Indian Ocean Territory',
      bn: 'Brunei Darussalam',
      bg: 'Bulgaria',
      bf: 'Burkina Faso',
      bi: 'Burundi',
      cb: 'Cabo Verde',
      kh: 'Cambodia',
      cm: 'Cameroon',
      ca: 'Canada',
      ky: 'Cayman Islands',
      cf: 'Central Africa Republic',
      td: 'Chad',
      cl: 'Chile',
      cn: 'China',
      cx: 'Christmas Island',
      cc: 'Cocos Islands',
      co: 'Colombia',
      km: 'Comoros',
      cd: 'Congo',
      ck: 'Cook Islands',
      cr: 'Costa Rica',
      hr: 'Croatia',
      cu: 'Cuba',
      cw: 'Curacao',
      cy: 'Cyprus',
      cz: 'Czechia',
      ci: "Cote d'lvoire",
      dk: 'Denmark',
      dj: 'Djibouti',
      dm: 'Dominica',
      do: 'Dominica Republic',
      ec: 'Ecuador',
      eg: 'Egypt',
      sv: 'El Salvador',
      gq: 'Equatorial Guinea',
      er: 'Eritrea',
      ee: 'Estonia',
      sz: 'Eswatini',
      et: 'Ethiopia',
      fk: 'Falkland Islands',
      fo: 'Faroe Islands',
      fj: 'Fiji',
      fi: 'Finland',
      fr: 'France',
      gf: 'French Guiana',
      pf: 'French Polynesia',
      tf: 'French Southern Territories',
      ga: 'Gabon',
      gm: 'Gambia',
      ge: 'Georgia',
      de: 'Germany',
      gh: 'Ghana',
      gi: 'Gibraltar',
      gr: 'Greece',
      gl: 'Greenland',
      gd: 'Grenada',
      gp: 'Guadeloupe',
      gu: 'Guam',
      gt: 'Guatemala',
      gg: 'Guernsey',
      gn: 'Guinea',
      gw: 'Guinea-Bissau',
      gy: 'Guyana',
      ht: 'Haiti',
      hm: 'Heard Islands',
      va: 'Holy See',
      hn: 'Honduras',
      hk: 'Hong Kong',
      hu: 'Hungary',
      is: 'Iceland',
      in: 'India',
      id: 'Indonesia',
      iq: 'Iran',
      im: 'Isle of Man',
      il: 'Israel',
      it: 'Italy',
      jm: 'Jamaica',
      jp: 'Japan',
      je: 'Jersey',
      jo: 'Jordan',
      kz: 'Kazakhstan',
      ke: 'Kenya',
      ki: 'Kiribati',
      kp: 'Korea',
      kw: 'Kuwait',
      kg: 'Kyragyzstan',
      la: "Lao People's Democratic Republic",
      lv: 'Latvia',
      lb: 'Lebanon',
      ls: 'Lesotho',
      lr: 'Libya',
      li: 'Liechtenstein',
      lt: 'Lithuania',
      lu: 'Luxembourg',
      mo: 'Macao',
      mg: 'Madagascar',
      mw: 'Malawi',
      my: 'Malaysia',
      mv: 'Maldives',
      ml: 'Mali',
      mt: 'Malta',
      mh: 'Marshal Islands',
      mq: 'Martinique',
      mr: 'Mauritania',
      mu: 'Mauritius',
      yt: 'Mayotte',
      mx: 'Mexico',
      fm: 'Micronesia',
      md: 'Maldova',
      mc: 'Monaco',
      mn: 'Mongolia',
      me: 'Montenegro',
      ms: 'Montserrat',
      ma: 'Morocco',
      mz: 'Mozambique',
      mm: 'Myanmar',
      na: 'Namibia',
      nr: 'Nauru',
      np: 'Nepal',
      nl: 'Netherlands',
      nc: 'New Caledonia',
      nz: 'New Zealand',
      ni: 'Nicaragua',
      ne: 'Niger',
      ng: 'Nigeria',
      nu: 'Niue',
      nf: 'Norfolk Island',
      mp: 'Northern Mariana Islands',
      no: 'Norway',
      om: 'Oman',
      pk: 'Pakistan',
      pw: 'Palau',
      ps: 'Palestine',
      pa: 'Panama',
      pg: 'Papua New Guinea',
      py: 'Paraguay',
      pe: 'Peru',
      ph: 'Philippines',
      pn: 'Pitcairn',
      pl: 'Poland',
      pt: 'Portugal',
      pr: 'Puerto Rico',
      qa: 'Qatar',
      mk: 'Republic of North Macedonia',
      ro: 'Romania',
      ru: 'Russia',
      rw: 'Rwanda',
      re: 'Reunion',
      bl: 'Saint Barthelemy',
      sh: 'Saint Helena',
      lc: 'Saint Lucia',
      mf: 'Saint Martin',
      pm: 'Saint Pierre',
      vc: 'Saint Vincent',
      ws: 'Samoa',
      sm: 'San Marino',
      st: 'Sao Tome',
      sa: 'Saudi Arabia',
      sn: 'Senegal',
      rs: 'Serbia',
      sc: 'Seychelles',
      sl: 'Sierra Leone',
      sg: 'Singapore',
      sx: 'Sint Maarten',
      sk: 'Slovakia',
      si: 'Slovenia',
      sb: 'Solomon Islands',
      so: 'Somalia',
      za: 'South Africa',
      gs: 'South Georgia',
      ss: 'South Sudan',
      es: 'Spain',
      lk: 'Sri Lanka',
      sd: 'Sudan',
      sr: 'Suriname',
      sj: 'Svalbard',
      se: 'Sweden',
      ch: 'Switzerland',
      sy: 'Syrian Arab Republic',
      tw: 'Taiwan',
      tj: 'Tajikistan',
      tz: 'Tanzania',
      th: 'Thailand',
      tl: 'Timor-Leste',
      tg: 'Togo',
      tk: 'Tokelau',
      to: 'Tonga',
      tt: 'Tobago',
      tn: 'Tunisia',
      tr: 'Turkey',
      tm: 'Turkmenistan',
      tc: 'Caicos Islands',
      tv: 'Tuvalu',
      ug: 'Uganda',
      ua: 'Ukraine',
      ae: 'United Arab Emirates',
      gb: 'United Kingdom',
      us: 'United States',
      uy: 'Uruguay',
      uz: 'Uzbekistan',
      vu: 'Vanuatu',
      ve: 'Venezuela',
      vn: 'Vietnam',
      vg: 'Virgin Islands',
      wf: 'Wallis',
      eh: 'Western Sahara',
      ye: 'Yemen',
      zm: 'Zambia',
      zw: 'Zimbabwe',
      ax: 'Aland Islands',
    }
  }

  /**
   * @description create items definitions object to be used globally
   * @param cb optional callback function
   */
  public initItems(cb = null) {
    let items = { ...itemCast }
    this.request.getItems((res, err) => {
      if (res) {
        if (res.status) {
          if (cb) cb(res.results)
          this.itemDef = items;
          return
        }
      }
    })
  }

  public getPackage(type) {
    return new Promise((resolve, reject) => {
      this.request.getFilteredPackages({ filters: { type: type } }, (res, err) => {
        if (res && res.status) resolve(res);
        if (res && !res.status) reject(err);
        if (err) reject(err);
      })
    })
  }

  public getItems() {
    return this.itemDef;
  }

  public filterCountries(value: string, customLabels): any {
    const filterValue = value.toLowerCase();
    let labels = [];
    Object.keys(customLabels).map((key) => {
      labels.push({ code: key, name: customLabels[key] });
    });
    let lablesSorted = labels.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
    return lablesSorted.filter(country => country.name.toLowerCase().indexOf(filterValue) === 0);
  }

  public getObjectByValue(labels, findValue): string {
    let findKey;
    (Object.keys(labels) as (keyof typeof labels)[]).find((key) => {
      if (labels[key] === findValue) {
        findKey = key;
      };
    });
    return findKey;
  }
}
