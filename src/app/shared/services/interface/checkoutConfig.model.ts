export default interface CheckoutConfig {
    selectedTheme?: any,
    selectedProduct?: any,
    packagePrice?: number,
    planPrice?: number,
    companyName?: string,
    selectedPlan?: string,
    selectedPlanId?: string,
    selectedPackage?: string,
    selectedPackageId?: string,
    paymentBasis?: string,
    firstTotal?:string|number,
    recurringTotal?:string|number,
    yearlyPlanOption?:{
      active: boolean,
      price: number,
      roomType: string,
      roomCount: number
    },
    addOns?:{
      setupFee: {
        id?:string,
        count?: number,
        price?: number,
        unit?: string,
        total?: number
      },
      rooms:{
        id?:string,
        monthlyId?:string,
        initialId?: string,
        initialMonthlyId?: string,
        count?: number,
        price?: number,
        monthlyPrice?: number,
        unit?: string,
        total?: number,
        initialCount?: number,
        initialTotalPrice?: number,
        initialMonthlyPrice?: number,
        initialPrice?: number
      },
      advancedFeatures:{
        id?:string,
        uid?:string,
        count?: number,
        description?: string,
        price?: number,
        unit?: string,
        total?: number,
        initialCount?: number,
        initialTotalPrice?: number
      },
      booths:{
        id?:string,
        monthlyId?:string,
        count?: number,
        price?: number,
        monthlyPrice?: number,
        description?: string,
        unit?: string,
        total?: number,
        initialCount?: number,
        initialTotalPrice?: number
      },
      liveVideoBroadcast:{
        id?:string,
        uid?:string,
        count?: number,
        price?: number,
        description?: string,
        unit?: string,
        total?: number,
        initialCount?: number,
        initialTotalPrice?: number
      },
      support:{
        id?:string,
        uid?:string,
        count?: number,
        price?: number,
        description?: string,
        unit?: string,
        total?: number,
        initialCount?: number,
        initialTotalPrice?: number
      },
      customDesign:{
        uid?:string,
        id?:string,
        count?: number,
        price?: number,
        total?: number
      },
      preEventSupport:{
        id?:string,
        count?: number,
        price?: number,
        total?: number,
        unit?: string
      }
    },
    monthly?: any[];
    annual?: any[];
    invoiceTotal?:number
}