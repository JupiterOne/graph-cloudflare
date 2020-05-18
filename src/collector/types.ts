/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PaginationInput {
  per_page: string;
  page: string;
  order?: string;
  direction: 'asc' | 'desc';
}

export interface PaginatedResponse {
  page: number;
  per_page: number;
  count: number;
  total_count: number;
}

export interface CloudflareApiResponse {
  success: boolean;
  errors: string[];
  messages: string[];
  result_info: PaginatedResponse;
  result: CloudflareObject[] | null;
}

export interface CloudflareObject {
  id: string;
  name: string;
  description?: string;
  created_on: string;
  modified_on: string;
  activated_on?: string;
  type?: string;
  ttl?: number;
  content?: string;
  status?: string;
  meta?: KeyValue;
  settings?: KeyValue;
  owner?: KeyValue;
  account?: KeyValue;
  user?: KeyValue;
  roles?: KeyValue[];
}

type KeyValue = { [key: string]: string | number | boolean };
