export interface resourceItem {
  id: string;
  name: string;
  type: string;
  unit: string;
  price: number;
  payment_cycle: number;
}

export interface itemsRef {
  uid: any;
  id: number | string;
  name?: string;
  quantity: number;
  monthly?: boolean;
  price: number;
}

export interface invoice {
  issue_date: string;
  sub_total: number;
  discount: number;
  total: number;
  stripe_payment_id: string;
  payment_date?: string;
  subscription_details_id: {
    id?: string;
    name?: string;
    uid?: string;
  };
  stellar_id: string;
  notes: string;
  status: string
  invoice_details: [
    {
      item_id: {
        id: string,
        name?:string
      },
      quantity: number,
      unit_price: number,
      total: number
    }
  ]
}

export interface invoiceItem {
  item_id: {
    uid: string | number;
    name?: string;
  };
  quantity: number;
  unit_price: number;
  total: number;
  invoice_id: {
    uid: string;
    name?: string;
  };
  start_date: string;
  expiry_date: string;
}

export interface invoiceCreateItemResponse {
  status: boolean;
  result: {
    item_id: {
      id: string;
      name: string;
    };
    invoice_id: {
      id: string;
      name: string;
    };
    createdAt: string;
    updatedAt: string;
    id: number;
    quantity: number | string;
    unit_price: number | string;
    total: number | string;
    start_date: string;
    expiry_date: string;
  };
}

export interface invoiceCreateResponse {
  status: boolean;
  results: {
    subscription_details_id: {
      id: string;
      name: string;
    };
    createdAt: string;
    updatedAt: string;
    id: number;
    issue_date: string;
    sub_total: number;
    discount: number;
    total: number;
    stripe_payment_id: string;
    notes: string;
    payment_date: string;
  };
}

export interface packageObject {
  name: string;
  type: string;
  price: number;
}

export interface packageDetailObject {
  package_id: {
    id: string;
    name: string;
  };
  item_id: {
    id: string;
    name?: string;
  };
  quantity: number;
}

export interface subscriptionObject {
  user_id: string;
  organization_id: string;
  organization_type?: string;
  stripe_customer_id?: string;
  client_id: {
    id: string;
    name?: string;
  };
  stripe_source_id?: string;
  auto_renew?: boolean;
  start_date?: string;
  end_date?: string;
  package_id: {
    id: string;
    name?: string;
  };
  stat_std_rooms?: number;
  stat_adv_rooms?: number;
  stat_booths?: number;
  stat_viewer_hrs?: number;
  stat_support_hrs?: number;
  stat_recording_gb?: string;
  stat_act_std_rooms?: number;
  stat_act_adv_rooms?: number;
  stat_act_booths?: number;
  stat_rem_viwer_hrs?: number;
  stat_rem_support_hrs?: number;
  stat_rem_recording_gb?: string;
}
