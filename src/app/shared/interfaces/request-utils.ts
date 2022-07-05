export interface filterObject {
  count?: number;
  exclude?: [];
  include?: [];
  order?: { field: string; order: string }[];
  page?: number;
  pagenationToken?: string;
  term?: string;
  fields?: string[];
  filter?: { field_name: string | any } | any;
}

export interface UserObject {
  email?: string;
  password?: string;
  active?: boolean;
  name?: string;
  id?: number;
  firstName?: string;
  lastName?: string;
}

export interface ticketCreate {
  first_name: string;
  last_name: string;
  company: string;
  email_address: string;
  client_id: string;
  phone_number: string;
  subject: string;
  message: string;
  ticket_date: string;
  status: string;
  priority: string;
  comment: string;
  agent_id?: {
    id: string;
    name?: string;
  };
}
