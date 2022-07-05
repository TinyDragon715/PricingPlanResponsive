import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { LayoutUtilsService, LoaderService, RequestService, StoreService } from "src/app/shared";
import stellarPlan from './stellar-packages';
import { FullscreenOverlayContainer } from "@angular/cdk/overlay";

@Component({
  selector: "app-plans",
  templateUrl: "./plans.component.html",
  styleUrls: ["./plans.component.scss"],
})

export class PlansComponent implements OnInit {
  isLoading: boolean = false;
  processing: boolean = false;
  planSelected: boolean = false;
  stellarPlanList = stellarPlan;
  cloudPriceFirst = '0';
  cloudPriceMonthly = '0';
  cloudPlan = '0';
  currentUser;
  currentSub;
  tooltipA = 'HD 1080p streaming 1000 GB Data Transfer\nWebsite Embed Code\nVideo On Demand Storage\n1TB Auto-recording\nLive Chat\nStreaming Analytics\nEmail Support  \n    Text Support  \n    1 hour of phone support  \n    30 mins of training  \nSetup $299.00';
  tooltipB = 'HD 1080p streaming Data Transfer 1500 GB\n   Facebook & YouTube Live Integration \n    Video On Demand Storage \n    1.5TBAuto-recording \n   Live Chat \n    Analytics  \n    Email Support  \n    Text Support \n  2 hours of phone support \n  1 hour training \n  Setup Fee $399.00 ';
  tooltipC = 'HD 1080p streaming Data Transfer 2.5 TB \n    Facebook & YouTube Live Integration \n    Branded Streaming Page \n    ROKU Channel  \n    Amazon Channel  \n    SEO \n    3 Facebook Ad Post Per Month \n     Simulated Live \n    Video On Demand Storage 2.5 TB\n     Video Monetization \n    2.5TB Auto-recording \n     Live Chat \n    Analytics \n    Email Support\n     Text Support \n    4 hours of phone support \n    2 hours training \n    Setup Fee: $2999.00 ';
  //current selected items & item count

  /**
   * @property recurring: recurring total to be billed yearly or monthly
   * @property onetime: one time payment items total
   * @property firstPayment: first time payment (recurring item total + onetime payment total)
   */
  public totals = {
    recurring: 0,
    firstPayment: 0
  }

  constructor(
    private router: Router,
    public dialog: MatDialog,
    private loadingService: LoaderService,
    private storeService: StoreService,
    private request: RequestService,
    private layoutUtilsService: LayoutUtilsService
  ) {

  }

  ngOnInit(): void {

    this.currentUser = this.storeService.get('currentUser');
    this.storeService.init('default');
    this.currentSub = this.storeService.get('currentSubscription');

    if (!this.validateUserLogin()) {
      this.router.navigate(['login'])
    }
    // this.loadingService.display(true);

    this.loadingService.status.subscribe(res => {
      this.isLoading = res;
    });
  }
  cloudChanged(event) {
    if (event) {
      this.cloudPlan = event.value;
      if (event.value == '0') {
        this.cloudPriceFirst = '0';
        this.cloudPriceMonthly = '0';
      }
      if (event.value == '1') {
        this.cloudPriceFirst = '$299.00 / Setup';
        this.cloudPriceMonthly = '$149.00 / Month';
      }
      if (event.value == '2') {
        this.cloudPriceFirst = '$399.00 / Setup';
        this.cloudPriceMonthly = '$349.00 / Month';
      }
      if (event.value == '3') {
        this.cloudPriceFirst = '$2999.00 / Setup';
        this.cloudPriceMonthly = '$649.00 / Month';
      }
    }
    console.log(event);
  }

  onCancel() {
    this.navigateToDashBoard();
  }

  openSBUEstimator(e?) {
    // if (e) e.preventDefault();
    // let dRef = this.dialog.open(RecordingEstimatorComponent, {
    //   width: "60vw",
    // });

    // dRef.afterClosed().subscribe((res) => {
    //   if (res) {
    //     // this.viewerHours.count = res;
    //     // this.onStreamingChange();
    //   }
    // });
  }

  private callSupport() {
    this.router.navigate(['/dashboard/support']);
  }

  async toCheckout(plan = 'lite') {
    // this.cloudPlan : 0,1,2,3
    // this.processing = true;
    let stripe_connected_account_id = 'acct_1IyG8lQQY019dieD'
    if (this.currentUser.agent_id.stripe_connected_account_id) {
      stripe_connected_account_id = this.currentUser.agent_id.stripe_connected_account_id;
    }
    let targetPlan = stripe_connected_account_id + '_' + plan + '_' + this.cloudPlan;
    console.log(targetPlan);
    let planURL = {
      //no connected account => direct client
      acct_1IyG8lQQY019dieD_full_0: 'https://buy.stripe.com/test_9AQeYmbn2flSeRy7sU',
      acct_1IyG8lQQY019dieD_full_1: 'https://buy.stripe.com/test_7sI17w1MsgpWcJqaF3',
      acct_1IyG8lQQY019dieD_full_2: 'https://buy.stripe.com/test_3cs9E2gHm6Pm24M28y',
      acct_1IyG8lQQY019dieD_full_3: 'https://buy.stripe.com/test_5kA9E21Msa1y9xe6oP',

      acct_1IyG8lQQY019dieD_lite_0: 'https://buy.stripe.com/test_4gwaI61Ms2z66l23cI',
      acct_1IyG8lQQY019dieD_lite_1: 'https://buy.stripe.com/test_8wMcQebn27Tq6l2dRl',
      acct_1IyG8lQQY019dieD_lite_2: 'https://buy.stripe.com/test_28ocQedva4He9xe3cG',
      acct_1IyG8lQQY019dieD_lite_3: 'https://buy.stripe.com/test_14kg2qaiY8XufVC7sV',
      //acct_1IyG5dQP0I5Ab6nK => Sana Hakeem
      acct_1IyG5dQP0I5Ab6nK_full_0: 'https://buy.stripe.com/test_14k17w8aQ1v210IbIO',
      acct_1IyG5dQP0I5Ab6nK_full_1: 'https://buy.stripe.com/test_28o17w0Ioa1yaBifZ2',
      acct_1IyG5dQP0I5Ab6nK_full_2: 'https://buy.stripe.com/test_4gweYm76M0qY38QdQS',
      acct_1IyG5dQP0I5Ab6nK_full_3: 'https://buy.stripe.com/test_5kA5nMgHma1y24M9AD',
      acct_1IyG5dQP0I5Ab6nK_lite_0: 'https://buy.stripe.com/test_cN2dUi1Ms8XueRy28f',
      acct_1IyG5dQP0I5Ab6nK_lite_1: 'https://buy.stripe.com/test_28o8zYgHmgpW38QbIQ',
      acct_1IyG5dQP0I5Ab6nK_lite_2: 'https://buy.stripe.com/test_bIYbMa76M6Pm9xe28h',
      acct_1IyG5dQP0I5Ab6nK_lite_3: 'https://buy.stripe.com/test_8wM6rQbn22z69xeeV4',
    };
    console.log(this.currentSub);
    // if (planURL[targetPlan]) {
    let finalURL = planURL[targetPlan] + '?client_reference_id=' + this.currentSub?.organization_id?.uid;
    console.log(finalURL);

    window.open(finalURL, '_new');

    this.router.navigate(['/dashboard']);
    //   } else {
    //     this.layoutUtilsService.errorElement('Error', 'Your agent account setup incomplete. please contact your agent.');
    //   }
    // } else {
    //   this.layoutUtilsService.errorElement('Error', 'Your agent account setup incomplete. please contact your agent.');
    // }
  }
  async skipCheckout() {
    this.navigateToDashBoard()
  }


  /**
   * @description check if user data is stored in localStorage
   */
  private validateUserLogin(): boolean {
    if (this.currentUser) {
      return true;
    }
    return false
  }


  public onHome() {
    this.navigateToDashBoard()
  }


  private navigateToDashBoard() {

    if (this.currentUser && this.currentUser.type == 1) {
      this.router.navigate(['/reseller/dashboard']);
      return
    }
    this.router.navigate(['/dashboard']);
  }
}
