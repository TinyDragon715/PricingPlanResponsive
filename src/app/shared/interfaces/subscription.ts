export interface subscriptionObject {
    user_id: {
      id: string,
      name?: string
    };
    organization_id: {
      id: string,
      name?:string
    };
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
  